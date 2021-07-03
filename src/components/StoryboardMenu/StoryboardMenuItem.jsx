import {Paper} from "@material-ui/core";
import globalConfig from "../../globalConfig";
import {Button} from "antd";
import React from "react";
import DragHandleIcon from "../primitives/DragHandleIcon";

const StoryboardMenuItem = (props) => {
    const {provided, snapshot, item, clickedID, setClickedID} = props;
    return (
        < Paper
            elevation={3}
            ref={provided.innerRef}
            {...provided.draggableProps}
            onClick={() => setClickedID(item.id)}
            style={{
                width: "100%",
                userSelect: "none",
                padding: 10,
                margin: "0 0 8px 0",
                minHeight: "30px",
                backgroundColor: clickedID===item.id
                    ? globalConfig.storyboardMenuColor.darkMenuOnClick
                    : globalConfig.storyboardMenuColor.darkMenuItem,
                color: "white",
                border: snapshot.isDragging ? `2px solid ${globalConfig.storyboardMenuColor.darkPrimary}` : null,
                ...provided.draggableProps.style
            }}>
            <Button
                type="link"
                shape="circle"
                icon={<DragHandleIcon  {...provided.dragHandleProps}
                                       style={{ color: 'white'}}
                />} />
            {'\u00A0'}   {item.content}
        </Paper>
    )
}

export default StoryboardMenuItem;
