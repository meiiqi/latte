function Box(anchor, cursor, angle, boundingBox, boxHelper, geometry=null) {
    this.id = app.generate_new_box_id(); // id (int) of Box
    this.object_id = 'car'; // object id (string)
    this.color = hover_color.clone(); // color of corner points
    this.angle = angle; // orientation of bounding box
    this.anchor = anchor; // point where bounding box was created
    this.cursor = cursor.clone(); // cursor
    this.added = false; // (boolean) whether the box has been added to boundingboxes
    this.boundingBox = boundingBox; // Box3; sets the size of the box
    this.boxHelper = boxHelper; // BoxHelper; helps visualize the box

    this.geometry = new THREE.Geometry(); // geometry for corner/rotating points

    this.colors = []; // colors of the corner points

    // add colors to points geometry
    for (var i = 0; i < 6; i++) {
        this.colors.push( this.color.clone().multiplyScalar( 7 ) );
    }
    this.geometry.colors = this.colors;

    // order of corners is max, min, topleft, bottomright
    this.geometry.vertices.push(anchor);
    this.geometry.vertices.push(cursor);
    this.geometry.vertices.push(anchor.clone());
    this.geometry.vertices.push(cursor.clone());
    this.geometry.vertices.push(getCenter(anchor.clone(), cursor.clone()));

    // visualizes the corners (in the non-rotated coordinates) of the box
    this.points = new THREE.Points( this.geometry, pointMaterial );
    this.points.frustumCulled = false; // allows
    this.timestamps = [];
    this.hasPredictedLabel = false;
    this.text_label;
    this.snowfall_label = "unlabelled";

    this.get_center = function() {
        var center3D = getCenter(this.geometry.vertices[0], this.geometry.vertices[1]);
        return new THREE.Vector2(center3D.z, center3D.x);
    }

    // method for resizing bounding box given cursor coordinates
    //
    // since BoxHelper3 draws a box in the same orientation as that of the point cloud,
    // we take the anchor and cursor, rotate them by the angle of the camera, draw the box,
    // then rotate the box back
    this.resize = function(cursor) {
        // checks and executes only if anchor does not overlap with cursor to avoid 0 determinant
        if (cursor.x != this.anchor.x && cursor.y != this.anchor.y && cursor.z != this.anchor.z) {

            var v1 = cursor.clone();
            var v2 = this.anchor.clone();

            // v1.y = 0;
            // v2.y = 0;

            // rotate cursor and anchor
            rotate(v1, v2, this.angle);

            // calculating corner points and rotating point
            var minVector = getMin(v1, v2);
            var maxVector = getMax(v1, v2);
            var topLeft = getTopLeft(v1, v2);
            var bottomRight = getBottomRight(v1, v2);
            var topCenter = getCenter(topLeft, maxVector);
            var bottomCenter = getCenter(minVector, bottomRight);

            // need to do this to make matrix invertible
            maxVector.y += 0.00001;

            // setting bounding box limits
            this.boundingBox.set(minVector.clone(), maxVector.clone());

            // rotate BoxHelper back
            this.boxHelper.rotation.y = this.angle;

            // setting y coordinate back to zero since we are done with drawing
            maxVector.y -= 0.00001;

            // rotate back the corner points
            rotate(minVector, maxVector, -this.angle);
            rotate(topLeft, bottomRight, -this.angle);
            rotate(topCenter, bottomCenter, -this.angle);

            // set updated corner points used to resize box
            this.geometry.vertices[0] = maxVector.clone();
            this.geometry.vertices[1] = minVector.clone();
            this.geometry.vertices[2] = topLeft.clone();
            this.geometry.vertices[3] = bottomRight.clone();
            this.geometry.vertices[4] = bottomCenter.clone();

            // tell scene to update corner points
            this.geometry.verticesNeedUpdate = true;
        }
    }

    this.resize_incrementally = function(direction) {
        if (direction == "bigger_on_x") {
            this.geometry.scale(1.1, 1, 1)
        }
        else if (direction == "bigger_on_y") {
            this.geometry.scale(1, 1.1, 1)
        }
        else if (direction == "bigger_on_z") {
            this.geometry.scale(1, 1, 1.1)
        }
        else if (direction == "smaller_on_x") {
            this.geometry.scale(0.9, 1, 1)
        }
        else if (direction == "smaller_on_y") {
            this.geometry.scale(1, 0.9, 1)
        }
        else if (direction == "smaller_on_z") {
            this.geometry.scale(1, 1, 0.9)
        }

        var maxVector = this.geometry.vertices[0].clone();
        var minVector = this.geometry.vertices[1].clone();
        var topLeft = this.geometry.vertices[2].clone();
        var bottomRight = this.geometry.vertices[3].clone();
        var topCenter = getCenter(maxVector, topLeft);
        var bottomCenter = this.geometry.vertices[4].clone();

        rotate(maxVector, minVector, this.angle);
        rotate(topLeft, bottomRight, this.angle);
        rotate(topCenter, bottomCenter, this.angle);

        // need to do this to make matrix invertible
        maxVector.y += 0.0000001;

        this.boundingBox.set(minVector, maxVector);

        // tell scene to update corner points
        this.geometry.verticesNeedUpdate = true;
    }

    // method to rotate bounding box by clicking and dragging rotate point,
    // which is the top center point on the bounding box
    this.rotate = function(cursor) {
        // get corner points
        var maxVector = this.geometry.vertices[0].clone();
        var minVector = this.geometry.vertices[1].clone();
        var topLeft = this.geometry.vertices[2].clone();
        var bottomRight = this.geometry.vertices[3].clone();
        var topCenter = getCenter(maxVector, topLeft);
        var bottomCenter = this.geometry.vertices[4].clone();

        // get relative angle of cursor with respect to
        var center = getCenter(maxVector, minVector);
        var angle = getAngle(center, bottomCenter, cursor, topCenter);

        // update angle of Box and bounding box
        this.angle = this.angle + angle;
        this.boxHelper.rotation.y = this.angle;

        // rotate and update corner points
        rotate(minVector, maxVector, -angle);
        rotate(topLeft, bottomRight, -angle);
        rotate(topCenter, bottomCenter, -angle);

        this.geometry.vertices[0] = maxVector.clone();
        this.geometry.vertices[1] = minVector.clone();
        this.geometry.vertices[2] = topLeft.clone();
        this.geometry.vertices[3] = bottomRight.clone();
        this.geometry.vertices[4] = bottomCenter.clone();

        // tell scene to update corner points
        this.geometry.verticesNeedUpdate = true;

    }

    // method to translate bounding box given a reference point
    this.translate = function(v) {
        // get difference in x and z coordinates between cursor when
        // box was selected and current cursor position
        if (globalThis.translate_ctrl)
        {
            var new_val = event.clientY
            var dy = new_val - this.screen_y_val
            this.anchor.y += dy;
            this.screen_y_val = new_val // update
            for (var i = 0; i < this.geometry.vertices.length; i++) {
                var p = this.geometry.vertices[i];
                p.y += dy;
            }
        }
        else
        {
            var dx = v.x - this.cursor.x;
            var dz = v.z - this.cursor.z;

            // update all points related to box by dx and dz
            this.anchor.x += dx;
            this.anchor.z += dz;
            this.cursor = v.clone();
            for (var i = 0; i < this.geometry.vertices.length; i++) {
                var p = this.geometry.vertices[i];
                p.x += dx;
                p.z += dz;
            }
        }

        // shift bounding box given new corner points
        var maxVector = this.geometry.vertices[0].clone();
        var minVector = this.geometry.vertices[1].clone();
        var topLeft = this.geometry.vertices[2].clone();
        var bottomRight = this.geometry.vertices[3].clone();
        var topCenter = getCenter(maxVector, topLeft);
        var bottomCenter = this.geometry.vertices[4].clone();

        rotate(maxVector, minVector, this.angle);
        rotate(topLeft, bottomRight, this.angle);
        rotate(topCenter, bottomCenter, this.angle);

        // need to do this to make matrix invertible
        maxVector.y += 0.0000001;

        this.boundingBox.set(minVector, maxVector);

        // tell scene to update corner points
        this.geometry.verticesNeedUpdate = true;
    }

    this.translate_incrementally = function(direction) {
        var dy = 0;
        var dx = 0;
        var dz = 0;
        if (direction == "up") {
            dy = 0.5
        }
        else if (direction == "down") {
            dy = -0.5
        }
        else if (direction == "right") {
            dx = 0.5
        }
        else if (direction == "left") {
            dx = -0.5
        }
        else if (direction == "front") {
            dz = 0.5
        }
        else if (direction == "back") {
            dz = -0.5
        }
        this.anchor.x += dx;
        this.anchor.y += dy;
        this.anchor.z += dz;

        for (var i = 0; i < this.geometry.vertices.length; i++) {
            var p = this.geometry.vertices[i];
            p.x += dx;
            p.y += dy;
            p.z += dz;
        }

        var maxVector = this.geometry.vertices[0].clone();
        var minVector = this.geometry.vertices[1].clone();
        var topLeft = this.geometry.vertices[2].clone();
        var bottomRight = this.geometry.vertices[3].clone();
        var topCenter = getCenter(maxVector, topLeft);
        var bottomCenter = this.geometry.vertices[4].clone();

        rotate(maxVector, minVector, this.angle);
        rotate(topLeft, bottomRight, this.angle);
        rotate(topCenter, bottomCenter, this.angle);

        // need to do this to make matrix invertible
        maxVector.y += 0.0000001;

        this.boundingBox.set(minVector, maxVector);

        // tell scene to update corner points
        this.geometry.verticesNeedUpdate = true;
    }

    this.select_points_inside = function() {
        num_points = app.cur_pointcloud.geometry.vertices.length
        var selected_indices = [];
        for (var i = 0; i < num_points; i++)
        {
            var v = app.cur_pointcloud.geometry.vertices[i];

            if (this.boundingBox.containsPoint(v))
            {
                selected_indices.push(i);
            }

        }
        return selected_indices;
    }

    this.label_points_as_snow = function(points_indices) {
        // this.snowfall_label = "snow"
        highlightPoints_customColor(points_indices, 0x00FFFF);

        app.snow_points_indices = app.snow_points_indices.concat(points_indices)
    }

    this.label_points_as_non_snow = function(points_indices) {
        highlightPoints_customColor(points_indices, 0xCCCCCC);

        app.non_snow_points_indices = app.non_snow_points_indices.concat(points_indices)
        // this.snowfall_label = "non-snow"
    }

    this.unlabel_points = function(points_indices) {
        // this.snowfall_label = "unlabelled"
        unhighlightPoints(points_indices);

        for (var i=0; i < points_indices.length; i++)
        {
            // remove point from list of non snow points
            var idx = app.non_snow_points_indices.indexOf(points_indices[i]);
            if (idx >= 0)
            {
                app.non_snow_points_indices.splice(idx, 1);
            }

            // remove point from list of snow points
            idx = app.snow_points_indices.indexOf(points_indices[i]);
            if (idx >= 0)
            {
                app.snow_points_indices.splice(idx, 1);
            }
        }
    }

    // method to highlight box given cursor
    this.select = function(cursor) {
        selectedBox = this;
        if (this && cursor) {
            selectedBox.cursor = cursor;
        }
        updateHoverBoxes(cursor);
        // this.changeBoundingBoxColor(new THREE.Color( 0,0,7 ) );
        this.changeBoundingBoxColor(selected_color);
    }


    // changes and updates a box's point's color given point index and color
    this.changePointColor = function(idx, color) {
        this.colors[idx] = color;
        this.geometry.colorsNeedUpdate = true;
    }
    // method to change color of bounding box
    this.changeBoundingBoxColor = function(color) {
        boxHelper.material.color.set(color);
    }

    this.output = function() {
        return new OutputBox(this);
    }

    this.get_cursor_distance_threshold = function() {
        return Math.min(distance2D(this.geometry.vertices[0], this.geometry.vertices[2]),
            distance2D(this.geometry.vertices[0], this.geometry.vertices[1])) / 4;
    }

    this.set_box_id = function(box_id) {
        if (typeof(box_id) == 'string') {
            box_id = parseInt(box_id);
        }
        this.id = box_id;
        this.text_label.setHTML(this.id.toString());
    }

    this.add_timestamp = function() {
        this.timestamps.push(Date.now());
    }

    this.add_text_label = function() {
        var text = this.create_text_label();
        text.setHTML(this.id.toString());
        text.setParent(this.boxHelper);
        container.appendChild(text.element);
        this.text_label = text;
    }

    this.create_text_label = function() {
        var div = document.createElement('div');
        div.className = 'text-label';
        div.style.position = 'absolute';
        div.style.width = 100;
        div.style.height = 100;
        div.innerHTML = "hi there!";
        div.style.top = -1000;
        div.style.left = -1000;

        var _this = this;

        return {
          element: div,
          parent: false,
          position: new THREE.Vector3(0,0,0),
          setHTML: function(html) {
            this.element.innerHTML = html;
          },
          setParent: function(threejsobj) {
            this.parent = threejsobj;
          },
          updatePosition: function() {
            if (this.parent) {
              this.position.copy(this.parent.position);
            }
            var coords2d = this.get2DCoords(this.position, camera);
            this.element.style.left = coords2d.x + 'px';
            this.element.style.top = coords2d.y + 'px';
          },
          get2DCoords: function(position, camera) {
            var vector = position.project(camera);
            vector.x = (vector.x + 1)/2 * window.innerWidth;
            vector.y = -(vector.y - 1)/2 * window.innerHeight;
            return vector;
          }
        };
    }

    this.label_as_snow = function() {
        points = this.select_points_inside()
        this.label_points_as_snow(points)
    }
    this.label_as_non_snow = function() {
        points = this.select_points_inside()
        this.label_points_as_non_snow(points)
    }

    this.unlabel = function() {
        points = this.select_points_inside()
        this.unlabel_points(points)
    }
}

Box.parseJSON = function(json_boxes) {
    var bounding_boxes = [], box;
    var json_box, center, top_right, bottom_left;
    var w, l, cx, cy, angle;
    if (!Array.isArray(json_boxes)) {
        json_boxes = [json_boxes];
    }
    for (var i = 0; i < json_boxes.length; i++) {
        json_box = json_boxes[i];
        angle = json_box['angle'];
        min = json_box['boundingBox']['min'];
        max = json_box['boundingBox']['max'];
        boundingBox_min = new THREE.Vector3(min["x"], min["y"], min["z"]);
        boundingBox_max = new THREE.Vector3(max["x"], max["y"], max["z"]);

        // rotate cursor and anchor
        rotate(boundingBox_max, boundingBox_min, -angle);
        box = createBox(boundingBox_max, boundingBox_min, angle);
        if (json_box.hasOwnProperty('box_id')) {
            box.id = json_box.box_id;
        }
        if (json_box.hasOwnProperty('object_id')) {
            box.object_id = json_box.object_id;
        }
        bounding_boxes.push(box);
        console.log("output: ", bounding_boxes);
    }
    return bounding_boxes;
}


// gets angle between v1 and v2 with respect to origin
//
// v3 is an optional reference point that should be v1's reflection about the origin,
// but is needed to get the correct sign of the angle
function getAngle(origin, v1, v2, v3) {
    v1 = v1.clone();
    v2 = v2.clone();
    origin = origin.clone();
    v1.sub(origin);
    v2.sub(origin);
    v1.y = 0;
    v2.y = 0;
    v1.normalize();
    v2.normalize();

    var angle = Math.acos(Math.min(1.0, v1.dot(v2)));
    if (v3) {
        v3 = v3.clone();
        v3.sub(origin);

        // calculates distance between v1 and v2 when v1 is rotated by angle
        var temp1 = v1.clone();
        rotate(temp1, v3.clone(), angle);
        var d1 = distance2D(temp1, v2);

        // calculates distance between v1 and v2 when v1 is rotated by -angle
        var temp2 = v1.clone();
        rotate(temp2, v3.clone(), -angle);
        var d2 = distance2D(temp2, v2);



        // compares distances to determine sign of angle
        if (d2 > d1) {
            angle = -angle;
        }
    }

    return angle;
}


// highlights closest corner point that intersects with cursor
function highlightCorners() {
    // get closest intersection with cursor
    var intersection = intersectWithCorner();
    if (intersection) {
        // get closest point and its respective box
        var box = intersection[0];
        var p = intersection[1];

        // get index of closest point
        var closestIdx = closestPoint(p, box.geometry.vertices);

        // if there was a previously hovered box, change its color back to red
        if (hoverBox) {
            // hoverBox.changePointColor(hoverIdx, new THREE.Color(7, 0, 0));
            hoverBox.changePointColor(hoverIdx, hover_color.clone());
        }

        // update hover box
        hoverBox = box;
        hoverIdx = closestIdx;
        // hoverBox.changePointColor(hoverIdx, new THREE.Color(0, 0, 7));
        hoverBox.changePointColor(hoverIdx, selected_color.clone());

    } else {

        // change color of previously hovered box back to red
        if (hoverBox) {
            // hoverBox.changePointColor(hoverIdx, new THREE.Color(7, 0, 0));
            hoverBox.changePointColor(hoverIdx, hover_color.clone());
        }

        // set hover box to null since there is no intersection
        hoverBox = null;
    }
}




// method to add box to boundingBoxes and object id table
// should only be called when you physically draw a box,
// not for loading a frame
function addBox(box) {
    app.cur_frame.bounding_boxes.push(box);
    addObjectRow(box);
    box.add_text_label();
}

function stringifyBoundingBoxes(boundingBoxes) {
    var outputBoxes = [];
    for (var i = 0; i < boundingBoxes.length; i++) {
        outputBoxes.push(new OutputBox(boundingBoxes[i]));
    }
    return outputBoxes;
}

function createBox(anchor, v, angle) {
    newBoundingBox = new THREE.Box3(v, anchor);
    newBoxHelper = new THREE.Box3Helper( newBoundingBox, 0xffff00 );
    newBox = new Box(anchor, v, angle, newBoundingBox, newBoxHelper);
    newBox.resize(v);

    return newBox;
}

function createAndDrawBox(anchor, v, angle) {
    var newBox = createBox(anchor, v, angle);
    drawBox(newBox);
    return newBox;
}

function drawBox(box) {
    scene.add(box.points);
    scene.add(box.boxHelper);
}

// deletes selected box when delete key pressed
function deleteSelectedBox() {
    if (app.editing_box_id) {return;}
    var boundingBoxes = app.cur_frame.bounding_boxes;
    if (selectedBox) {
        scene.remove(selectedBox.points);
        scene.remove(selectedBox.boxHelper);
        selectedBox.text_label.element.remove();

        // deletes corresponding row in object id table
        deleteRow(selectedBox.id);

        // removes selected box from array of currently hovered boxes
        for (var i = 0; i < hoverBoxes.length; i++) {
            if (hoverBoxes[i] == selectedBox) {
                hoverBoxes.splice(i, 1);
                break;
            }
        }

        // removes selected box from array of bounding boxes
        for (var i = 0; i < boundingBoxes.length; i++) {
            if (boundingBoxes[i] == selectedBox) {
                boundingBoxes.splice(i, 1);
                break;
            }
        }
        app.increment_delete_count();
        // removes selected box
        selectedBox = null;
    }
}

function translate_box_up() {
    if (selectedBox) {
        selectedBox.translate_incrementally("up")
    }
}

function translate_box_down() {
    if (selectedBox) {
        selectedBox.translate_incrementally("down")
    }
}

function translate_box_right() {
    if (selectedBox) {
        selectedBox.translate_incrementally("right")
    }
}

function translate_box_left() {
    if (selectedBox) {
        selectedBox.translate_incrementally("left")
    }
}

function translate_box_front() {
    if (selectedBox) {
        selectedBox.translate_incrementally("front")
    }
}

function translate_box_back() {
    if (selectedBox) {
        selectedBox.translate_incrementally("back")
    }
}

function shrink_box_x() {
    if (selectedBox) {
        selectedBox.resize_incrementally("smaller_on_x")
    }
}

function shrink_box_y() {
    if (selectedBox) {
        selectedBox.resize_incrementally("smaller_on_y")
    }
}

function shrink_box_z() {
    if (selectedBox) {
        selectedBox.resize_incrementally("smaller_on_z")
    }
}

function grow_box_x() {
    if (selectedBox) {
        selectedBox.resize_incrementally("bigger_on_x")
    }
}

function grow_box_y() {
    if (selectedBox) {
        selectedBox.resize_incrementally("bigger_on_y")
    }
}

function grow_box_z() {
    if (selectedBox) {
        selectedBox.resize_incrementally("bigger_on_z")
    }
}

// Store all useful information of a bounding box
function OutputBox(box) {
    this.box_id = box.id;
    this.angle = box.angle;
    this.object_id = box.object_id;
    this.timestamps = box.timestamps;
    this.boundingBox = box.boundingBox;
    this.snowfall_label = box.snowfall_label;
}