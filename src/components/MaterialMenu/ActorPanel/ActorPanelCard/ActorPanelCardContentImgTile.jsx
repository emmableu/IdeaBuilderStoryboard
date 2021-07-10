import React from 'react';
import Typography from '@material-ui/core/Typography';
import {Button, CardActions} from '@material-ui/core';
import ImgCard from "./ImgCard";
import ImgTitleEdiText from "./ImgTitleEdiText";
import axios from "../../../../axiosConfig";

const ContentNode = () => (
    <ImgTitleEdiText/>
);

const CardActionButtonGroup = () => (
    <>
        <CardActions>
            <Button size="small" color="primary">
                Share
            </Button>
            <Button size="small" color="primary">
                Learn More
            </Button>
        </CardActions>
    </>
);
const ActorPanelCardContentImgTile = (props) => {
    const {actorId, stateId} = props;
    React.useEffect(() => {
        console.log("stateId: ", stateId);
        console.log(axios.defaults.baseURL + "/static/" + stateId);
        },[stateId]
    );

    return (
        <>
            <ImgCard
                actorId={actorId}
                stateId={stateId}
                imgSrc={axios.defaults.baseURL + "/static/" + stateId}
                heightToWidthRatio={'75%'}
                contentNode={<ContentNode />}
            />
        </>
    )
}



export default ActorPanelCardContentImgTile;
