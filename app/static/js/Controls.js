var maxSize = 4;
var pointSize = 2;

var SettingsControls = function() {
                       this.size = pointSize / maxSize;
                };


var gui = new dat.GUI();
var settingsControls = new SettingsControls();
var settingsFolder = gui.addFolder('settings');
settingsFolder.add(settingsControls, 'size').min(0.0).max(1.0).step(0.05).onChange(function() {
    app.cur_pointcloud.material.size = settingsControls.size * maxSize;
    pointMaterial.size = 4 * settingsControls.size * maxSize;
});

settingsFolder.open();

function toggleRecord() {
    // pause recording
    if (isRecording) {
        $("#record").text("Click here to resume recording");
        app.pause_recording();
        // move2DMode(event);
        isRecording = false;
        controls.enabled = false;
        controls.update();

    } else {
        // resume recording
        isRecording = true;
        $("#record").text("Click here to pause recording");
        app.resume_recording();

        controls.enabled = true;
        controls.update();
    }
}
// controller for pressing hotkeys
function onKeyDown2(event) {
    if (isRecording) {
        if (event.ctrlKey) {
            toggleControl(false);
        }
        var KeyID = event.keyCode;
        switch(KeyID)
        {
            case 8: // backspace
                deleteSelectedBox();
                break;

            case 46: // delete
                deleteSelectedBox();
                break;

            case 65: // a key
                autoDrawModeToggle(true);
                break;

            case 90: // z key
                showPreviousFrameBoundingBoxToggle(true);
                break;

            case 68: // d key
                toggleTranslateControl()
                break;
            case 83: // s key
                toggleResizeControl()
                break;
            case 37: // Left arrow
                if (!controls.enabled) {
                    if (globalThis.translate_ctrl) {
                        translate_box_left()
                    }
                    if (globalThis.resize_ctrl) {
                        shrink_box_x()
                    }
                }
                break;
            case 38: // Up arrow
                if (!controls.enabled) {
                    if (globalThis.translate_ctrl) {
                        if (globalThis.apply_on_y_axis) {
                            translate_box_up()
                        }
                        else
                        {
                            translate_box_back()
                        }
                    }

                    if (globalThis.resize_ctrl) {
                        if (globalThis.apply_on_y_axis) {
                            grow_box_y()
                        }
                        else
                        {
                            grow_box_z()
                        }
                    }
                }
                break;
            case 39: // Right arrow
                if (!controls.enabled) {
                    if (globalThis.translate_ctrl) {
                        translate_box_right()
                    }
                    if (globalThis.resize_ctrl) {
                        grow_box_x()
                    }
                }
                break;
            case 40: // Down arrow
                if (!controls.enabled) {
                    if (globalThis.translate_ctrl) {
                        if (globalThis.apply_on_y_axis)
                        {
                            translate_box_down()
                        }
                        else
                        {
                            translate_box_front()
                        }
                    }

                    if (globalThis.resize_ctrl) {
                        if (globalThis.apply_on_y_axis) {
                            shrink_box_y()
                        }
                        else
                        {
                            shrink_box_z()
                        }
                    }
                }
                break;
            case 89: // y
                globalThis.apply_on_y_axis = globalThis.apply_on_y_axis ? false : true;
                break;
            case 67: // c: show all labeled snow points
                globalThis.key_show_snow_points = true
                globalThis.key_show_non_snow_points = false
                show_snow_points()
                break;
            case 86: // v: show all labeled non-snow points
                globalThis.key_show_non_snow_points = true
                globalThis.key_show_snow_points = false
                show_non_snow_points()
                break;
            default:
            break;
        }
    }
}

// controller for releasing hotkeys
function onKeyUp2(event) {
    if(isRecording) {
        var KeyID = event.keyCode;
        switch(KeyID)
        {
            case 65:
            autoDrawModeToggle(false);
          default:
          toggleControl(true);
          break;
        }
    }
}

function toggleTranslateControl()
{
    if (globalThis.translate_ctrl) {
        globalThis.translate_ctrl = false
    }
    else
    {
        globalThis.translate_ctrl = true
        globalThis.resize_ctrl = false // translate and resize control are mutually exclusive
    }
}

function toggleResizeControl() {
    if (globalThis.resize_ctrl) {
        globalThis.resize_ctrl = false
    }
    else
    {
        globalThis.resize_ctrl = true
        globalThis.translate_ctrl = false // translate and resize control are mutually exclusive
    }
}

function showPreviousFrameBoundingBoxToggle(b) {
    app.show_previous_frame_bounding_box();
}
function autoDrawModeToggle(b) {
    autoDrawMode = b;
}
// toggles between move2D and move3D
function toggleControl(b) {
    if (b) {
        controls.enabled = b;
        controls.update();
    } else {
        if (app.move2D) {
            controls.enabled = b;
            controls.update();
        }
    }
}

function updateMaskRCNNImagePanel() {
    $("#panel").empty();
    $("#panel").prepend('<img src="static/images/masked_image.jpg" />');
    $("#panel").find("img").attr({'src': "static/images/masked_image.jpg?foo=" + new Date().getTime()});
    $("#panel").slideDown( "slow" );
}

function updateCroppedImagePanel(child) {
    $("#panel2").empty();
    if (child == 'outside FOV') {
        $("#panel2").prepend("Bounding box is outside camera's FOV");
    } else {
        $("#panel2").prepend('<img src="static/images/cropped_image.jpg" />');
        $("#panel2").find("img").attr({'src': "static/images/cropped_image.jpg?foo=" + new Date().getTime()});
        $("#panel2").slideDown( "slow" );
    }

}

// controller for pressing hotkeys
function onKeyDown(event) {
    if (isRecording) {
        if (event.ctrlKey) {
            toggleControl(false);
        }
        var KeyID = event.keyCode;
        switch(KeyID)
        {
            case 8: // backspace
            deleteSelectedBox();
            break;
            case 46: // delete
            deleteSelectedBox();
            break;
            case 68:
            default:
            break;
        }
    }
}

// controller for releasing hotkeys
function onKeyUp(event) {
    if(isRecording) {
        var KeyID = event.keyCode;
        switch(KeyID)
        {
          default:
          toggleControl(true);
          break;
        }
    }
}

// toggles between move2D and move3D
function toggleControl(b) {
    if (b) {
        controls.enabled = b;
        controls.update();
    } else {
        if (move2D) {
            controls.enabled = b;
            controls.update();
        }
    }
}

function clearTable() {
    for (var i = 0; i < boundingBoxes.length; i++) {
            box = boundingBoxes[i];
            deleteRow(box.id);
        }
    id = 0;
}
