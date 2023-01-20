# Modified _LATTE_ for Snow Point Labelling

## Setup and Run App

1. open a terminal
   ```
   git bash
   ```
2. Go to the clone of this repository
   ```
   cd <path to your latte repository>
   ```
3. Create a virtual environment
   ```
   virtualenv env
   ```
4. Activate the virtual environment
   ```
   # In Windows
   . env/Scripts/activate
   ```
5. Run app
   ```
   python app/app.py
   ```
6. open http://127.0.0.1:5000/


## Controls

* `Backspace` or `del`: _deleteSelectedBox_

* `a` : _autoDrawModeToggle_

* `z`: _showPreviousFrameBoundingBoxToggle_

* `d`: _translate_ctrl_ toggle

* `s`:   _resize_ctrl_ toggle

* `ctrl + left`:
   * _translate_box_left_ - if _translate_ctrl_
   * _shrink_box_x_ - if _resize_ctrl_

* `ctrl + up`:
   * _translate_box_up_ - if _translate_ctrl_ and _apply_on_y_axis_
   * _translate_box_back_ - if _translate_ctrl_ and !_apply_on_y_axis_
   * _grow_box_y_ - if _translate_ctrl_ and _apply_on_y_axis_
   * _grow_box_z_ - if _translate_ctrl_ and !_apply_on_y_axis_

* `ctrl + right`:
   * _translate_box_right_ - if _translate_ctrl_
   * _grow_box_x_ - if _resize_ctrl_

* `ctrl + down`:
   * _translate_box_down_ - if _translate_ctrl_ and _apply_on_y_axis_
   * _translate_box_front_ - if _translate_ctrl_ and !_apply_on_y_axis_
   * _shrink_box_y_ - if _translate_ctrl_ and _apply_on_y_axis_
   * _shrink_box_z_ - if _translate_ctrl_ and !_apply_on_y_axis_

* `y`: _apply_on_y_axis_ toggle

* `c`: Show all snow points

* `v`: Show all non-snow points

** TODO: show all unlabelled points

---
## FEATURE REQUESTS
> Label Legend:
> * FUNC: functionality related features
> * UI: user interface related features
> * BUG: bug

* ~~[ FUNC ] Save labels with boxes~~
* ~~[ FUNC ] ability to nest boxes~~
* [ FUNC ] ability to reorder boxes and then apply labels using order of boxes on order change
* [ FUNC ] On box size/location change, relabel all points if has existing label
* [ FUNC ] show/hide unlabelled points
* [ FUNC ] default label all points as non-snow points? - make it an option
* [ FUNC ] hide labelled snow points
* [ FUNC ] hide labelled non-snow points
* [ FUNC ] ability to reorder boxes

* ~~[ UI ] label points in box through UI: ability to label a box and all points in box inherit label~~
* [ UI ] make UI controls panel instead of using key board shortcuts
* [ UI ] make UI controls box to be able to specify size of box
* [ UI ] UI Info pannel to give stats of scene (how many snow points, non snow points, boxes, size of boxes)

* [ BUG ][ UI ] corners not accurate anymore when box resizes/moves