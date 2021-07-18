import React, { useState } from "react";
import EdiText from "react-editext";
import styled from 'styled-components';
import {IconButton, Tooltip} from "@material-ui/core";
import {Create} from "@material-ui/icons";
import {useDispatch, useSelector} from "react-redux";
import {updateName, updateStoryboardName} from "../../redux/features/projectSlice";
import {ProjectDataHandler} from "../../data/ProjectData";


const StyledEdiText = styled(EdiText)`
  button {
    border-radius: 5px;
    padding: 0;
    border: none;
    background: none;
  }
  button[editext="edit-button"] {
  }
  button[editext="save-button"] {
     display: none
  }
  button[editext="cancel-button"] {
      display: none
  }
  input, textarea {
    height: 30px;
    border-radius: 20px;
    width: 300px;
  }
  div[editext="view-container"]{
    padding: 5px 0px 0px;
   }
  div[editext="edit-container"] {
    text-align: center;
  }
`

const EditButton = () => (
    <Tooltip title="Edit storyboard title">
        <IconButton aria-label="display more actions" color="inherit" size="small">
            <Create/>
        </IconButton>
    </Tooltip>
)

const StoryboardTitleEdiText = () => {
    const [editing, setEditing] = useState(false);
    const [value, setValue] = useState("Untitled");
    const dispatch = useDispatch()

    const selectedStoryboard = useSelector(state => state.project.value.selectedId.storyboardId)

    const titleName = useSelector(state =>
        {
            if (selectedStoryboard === "UNDEFINED") return "Untitled";
            if (selectedStoryboard === null) return "Untitled";
            if (state.project.value===null) return "Untitled";
            // undefined can still happen when page reloads.
            if (ProjectDataHandler.getStoryboard(state.project.value, selectedStoryboard) === undefined) {
                return "Untitled"
            }
            return ProjectDataHandler.getStoryboard(state.project.value, selectedStoryboard).name;
        }
    )


    React.useEffect(() => {
        setValue(titleName)
    }, [titleName])

    const handleSave = (value) => {
        // // console.log(value);
        setValue(value);
        dispatch(
            updateStoryboardName({
                "_id": selectedStoryboard,
                "name": value
            }));
    };
    return (
                <StyledEdiText
                    submitOnUnfocus
                    submitOnEnter
                    cancelOnEscape
                    value={value}
                    type="text"
                    onSave={handleSave}
                    editButtonContent={<EditButton/>}
                    editing={editing}
                    showButtonsOnHover
                    hideIcons={true}
                />
    );
}


export default StoryboardTitleEdiText;
