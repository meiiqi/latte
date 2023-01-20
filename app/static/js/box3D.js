function Box3D(anchor, cursor, angle, boundingBox, boxHelper) {
    this.id = app.generate_new_box_id(); // id (int) of Boxthis.color = hover_color.clone(); // color of corner points
    this.angle = angle; // orientation of bounding box
    this.anchor = anchor; // point where bounding box was created
    this.cursor = cursor.clone(); // cursor
    this.added = false; // (boolean) whether the box has been added to boundingboxes
    this.boundingBox = boundingBox; // Box3; sets the size of the box
    this.boxHelper = boxHelper; // BoxHelper; helps visualize the box
    this.geometry = new THREE.Geometry(); // geometry for corner/rotating points

    // visualizes the corners (in the non-rotated coordinates) of the box
    this.points = new THREE.Points( this.geometry, pointMaterial );
    this.points.frustumCulled = false; // allows 
    this.timestamps = [];
    
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

    this.hasPredictedLabel = false;
    this.text_label;

    this.resize = function(cursor) {
        // checks and executes only if anchor does not overlap with cursor to avoid 0 determinant
        if (cursor.x != this.anchor.x && cursor.y != this.anchor.y && cursor.z != this.anchor.z) {
            var v1 = cursor.clone();
            var v2 = this.anchor.clone();

            v1.y = 0;
            v2.y = 0;
            
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
            maxVector.y = 0.00001; 

            // setting bounding box limits
            this.boundingBox.set(minVector.clone(), maxVector.clone());

            // rotate BoxHelper back
            this.boxHelper.rotation.y = this.angle;

            // setting y coordinate back to zero since we are done with drawing
            maxVector.y = 0;

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
}