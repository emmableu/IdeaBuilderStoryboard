import {Add, Chat} from "@material-ui/icons";
import { DownOutlined } from '@ant-design/icons';
import {Button, makeStyles, Tooltip} from "@material-ui/core";
import React from "react";
import NewMotionMenuItem from "./NewMotionMenuItem";
import { Menu, Dropdown } from 'antd';
import {updateStarList} from "../../redux/features/projectSlice";
import MenuItem from "@material-ui/core/MenuItem";
import {useDispatch} from "react-redux";
import {MotionIcon} from "../primitives/Icon/Icon";


const MotionButton = (props) => {
    const {storyboardId, frameId, selectedStar, selectedActor, backdropStar, starList} = props;
    const dispatch = useDispatch()
    const [hasMotion, setHasMotion] = React.useState(
        selectedStar.childStarList.findIndex(s => s.type === "speech") !== -1
    );

    const deleteMotion = (e) => {
        setHasMotion(false);
    }
    const menu = (
        <Menu>
            <NewMotionMenuItem
                storyboardId={storyboardId}
                frameId={frameId}
                selectedStar={selectedStar}
                selectedActor={selectedActor}
                hasMotion={hasMotion}
                setHasMotion={setHasMotion}
                backdropStar={backdropStar}
                starList={starList}
            />
            <MenuItem
                disabled={hasMotion===false}
                onClick={deleteMotion}>Delete motion</MenuItem>
        </Menu>
    );


    return (<Dropdown overlay={menu}
                      overlayStyle={{zIndex:1}}
    >
        <Tooltip title="Create motion">
            <Button aria-label="draw motion"
                    // size="small"
                    type="text"
                    style={{color: "grey"}}
                    onClick={e => e.preventDefault()}>
                Motion {'\u00A0'} <DownOutlined />
            </Button>
        </Tooltip>

    </Dropdown>)
};


export default MotionButton;
