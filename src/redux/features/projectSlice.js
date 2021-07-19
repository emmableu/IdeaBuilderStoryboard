import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import {ProjectDataHandler} from "../../data/ProjectData";
import {StoryboardDataHandler} from "../../data/StoryboardData";
import {ProjectAPI} from "../../api/ProjectAPI";
import Cookies from "js-cookie";
import * as UUID from "uuid";
import {ActorDataHandler} from "../../data/ActorData";
import {BackdropDataHandler} from "../../data/BackdropData";
import globalConfig from "../../globalConfig";
import {copyPreviousFrameImg, sendEmptyFrameImg, updateUserActionCounter} from "./frameThumbnailStateSlice";
import {FrameDataHandler} from "../../data/FrameData";
import {SelectedIdDataHandler} from "../../data/SelectedIdData";


const insertEmptyProjectToDatabase = createAsyncThunk(
    'project/insertNewProjectToDatabase',
    async (obj, thunkAPI) => {
        const {_id, name} = obj;
        const projectData = ProjectDataHandler.initializeProject({_id, name});
        console.log('projectData: ', projectData);
        const response = await ProjectAPI.insertProject(Cookies.get("userId"), projectData);
        return response.status;
    }
)

const loadProjectFromDatabase = createAsyncThunk(
    'project/loadProjectFromDatabase',
    async (_id, thunkAPI) => {
        const response = await ProjectAPI.loadProject(_id);
        const {dispatch} = thunkAPI;
        //below is needed because otherwise the first frame is not updated.
        dispatch(updateUserActionCounter());
        setTimeout( () => {
                dispatch(updateUserActionCounter());
            }, 2000
        )
        return response.data;
    }
)

const updateName = createAsyncThunk(
    'project/updateName',
    async (name, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        dispatch(updateNameInMemory(name));
        const projectId = getState().project.value._id;
        const response = await ProjectAPI.updateName({
            projectId, name
        });
        return response.status;
    }
);

/* The next section are about selectedIds:
 */

const setSelectedStoryboardId = createAsyncThunk(
    'project/setSelectedStoryboardId',
    async (storyboardId, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        const project = getState().project.value;
        const storyboardData = ProjectDataHandler.getStoryboard(project, storyboardId);

        // SelectedIdDataHandler.setStoryboardId(project.selectedId, storyboardData);
        dispatch(setSelectedStoryboardIdInMemory(storyboardData));

        //although adding storyboard automatically set frame IDs, we should do it again because sometimes redux does not recognize it being updated.
        if (storyboardData.frameList.length > 0){
            dispatch(setSelectedFrameIdInMemory(storyboardData.frameList[0]._id));
            // SelectedIdDataHandler.setFrameId(project.selectedId, storyboardData.frameList[0]._id);
        }
        dispatch(updateUserActionCounter());
        //this is also because frame thumbnail does not update.
        setTimeout( () => {
                dispatch(updateUserActionCounter());
            }, 500
        )

        const response = await ProjectAPI.updateSelectedIdData(
            {
                projectId: project._id,
                selectedId: project.selectedId
                }
            );
        return response.status;
    }
);


const setSelectedFrameId = createAsyncThunk(
    'project/setSelectedFrameId',
    async (frameId, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        const project = getState().project.value;
        dispatch(setSelectedFrameIdInMemory(frameId));
        const response = await ProjectAPI.updateSelectedIdData(
            {
                projectId: project._id,
                selectedId: project.selectedId
            }
        );
        return response.status;
    }
);


const setSelectedStarId = createAsyncThunk(
    'project/setSelectedStarId',
    async (starId, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        const project = getState().project.value;
        SelectedIdDataHandler.setStarId(project.selectedId, starId);
        const response = await ProjectAPI.updateSelectedIdData(
            {
                projectId: project._id,
                selectedId: project.selectedId
            }
        );
        return response.status;
    }
);






/* The next section are about storyboards:
 */

const addStoryboard = createAsyncThunk(
    'project/addStoryboard',
    async (text, thunkAPI) => {
        const {storyboardName, type} = text;
        const {dispatch, getState}  = thunkAPI;
        const storyboardId = UUID.v4();
        const storyboardDataJSON = StoryboardDataHandler.initializeStoryboard(storyboardId, storyboardName);
        const state = getState();
        const project = state.project.value;
        const projectId = project._id;
        const payload =  {
            projectId,
            type,
            storyboardDataJSON
        };
        const newFrameId = storyboardDataJSON.frameList[0]._id;
        console.log("newFrameId: ", newFrameId);
        await dispatch(sendEmptyFrameImg(newFrameId));
        dispatch(addStoryboardInMemory(JSON.stringify(payload)));
        console.log("storyboardJSON: ", storyboardDataJSON);
        const response = await ProjectAPI.addStoryboard(payload);
        return response.status;
    }
)

const deleteStoryboard = createAsyncThunk(
    'project/deleteStoryboard',
    async (storyboardId, thunkAPI) => {
        console.log("storyboardID: ", storyboardId);
        const {dispatch, getState} = thunkAPI;
        const state = getState();
        const project = state.project.value;
        const projectId = project._id;
        const storyboardMenu = state.project.value.storyboardMenu;
        project.selectedId.voidStoryboardId();
        dispatch(deleteStoryboardInMemory(storyboardId));
        const response = await ProjectAPI.replaceStoryboardIdMenuInDatabase({
            projectId, storyboardMenu
        });
        return response.status;
    }
);

const updateStoryboardOrder = createAsyncThunk(
    'project/updateStoryboardOrder',
    async (text, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        console.log("----------------------text: ", text);
        dispatch(updateStoryboardOrderInMemory(text));
        const state = getState();
        const projectId = state.project.value._id;
        const storyboardMenu = state.project.value.storyboardMenu;
        const response = await ProjectAPI.replaceStoryboardIdMenuInDatabase({
            projectId, storyboardMenu
        });
        return response.status;
    }
);

const updateStoryboardName = createAsyncThunk(
    'project/updateStoryboardName',
    async (payload, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        dispatch(updateStoryboardNameInMemory(JSON.stringify(payload)));
        const response = await ProjectAPI.updateStoryboardName(payload);
        return response.status;
    }
);

/* The next section are about frames:
 */

const addFrame = createAsyncThunk(
    'project/addFrame',
    async (payload, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        const project = getState().project.value;
        console.log("project: ", project);
        const storyboardId = project.selectedId.storyboardId;
        console.log("storyboardId: ", storyboardId);
        const frameList = ProjectDataHandler.getStoryboard(project, storyboardId).frameList;
        console.log("frameList: ", frameList);
        let prevIndex = frameList.length - 1
        const frameId = globalConfig.imageServer.student.frame + UUID.v4() + ".png";
        if (prevIndex >= 0) {
            await dispatch(copyPreviousFrameImg({
                prevId: frameList[prevIndex]._id,
                newId: frameId}));
        }
        else {
            await dispatch(
                sendEmptyFrameImg(
                    frameId
                )
            )
        }

        console.log("frameId: ", frameId);
        dispatch(addFrameInMemory(JSON.stringify({
            storyboardId,
            prevIndex,
            newId: frameId,
        })));
        dispatch(setSelectedFrameId(frameId));
        const newFrameList = ProjectDataHandler.getStoryboard(getState().project.value, storyboardId).frameList;
        console.log("newFrameList: ", newFrameList);
        const response = await ProjectAPI.insertFrameAndReplaceFrameListInDatabase({
            storyboardId,
            frameId,
            frameList: newFrameList,
        });
        return response.status;
    }
);

const deleteFrame = createAsyncThunk(
    'project/deleteFrame',
    async (frameIndex, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;


        const project = getState().project.value;
        const storyboardId = project.selectedId.storyboardId;
        // dispatch(deleteFrameInMemory(JSON.stringify({storyboardId, frameId})));
        // const storyboardData = state.value.getStoryboard(storyboardId);

        // project.getStoryboard(storyboardId).frameList = frameList;
        // console.log("frame list here: ", frameList);
        dispatch(updateFrameListInMemory(JSON.stringify(
            {storyboardId,
                    frameIndex
            }
        )));
        // if (frameIndex < frameList.length) {
        //     console.log("old id: ", frameId)
        //     console.log('frameIndex: ', frameIndex)
        //     console.log('frameList: ', frameList.length)
        //     dispatch(setSelectedFrameId(frameList[frameIndex]._id))
        //     console.log("selected frameID changed")
        //     console.log("new id: ", project.selectedId.frameId)
        // }
        // else {
        //     if (frameList.length > 0) {
        //         console.log('frameIndex: ', frameIndex)
        //         console.log('frameList: ', frameList.length)
        //         dispatch(setSelectedFrameId(frameList[frameIndex-1]._id))
        //     }
        //     else {
        //         console.log('frameIndex: ', frameIndex)
        //         console.log('frameList: ', frameList.length)
        //         // state.value.selectedId.voidFrameId();
        //         dispatch(setSelectedFrameId("UNDEFINED"))
        //     }
        // }

        const response = await ProjectAPI.replaceFrameIdListInDatabase({
            storyboardId,
            frameIdList: ProjectDataHandler.getStoryboard(project, storyboardId).frameList.map(f => f._id)
        });
        return response.status;
    }
);

/* The next section are about stars on the frame */
const addStar = createAsyncThunk(
    'project/addStar',
    async (stateId, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        const state = getState();
        const storyboardId = state.project.value.selectedId.storyboardId;
        const frameId = state.project.value.selectedId.frameId
        console.log("storyboardId: ", storyboardId)
        console.log("frameId: ", frameId)
        if (storyboardId === null || frameId === null) {return;}
        if (storyboardId === "UNDEFINED" || frameId === "UNDEFINED") {return;}
        dispatch(addStarInMemory(JSON.stringify({
            storyboardId, frameId, stateId,
        })));
        dispatch(updateUserActionCounter());

        setTimeout(() => {
            dispatch(updateUserActionCounter());
        }, 500)

        const storyboardData = ProjectDataHandler.getStoryboard(state.project.value, storyboardId);
        const frameData = StoryboardDataHandler.getFrame(storyboardData, frameId);
        const starList =  frameData.starList;

        //sometimes the first dispatch does not work, because the actor is not yet fully updated on the canvas.
        const response = await ProjectAPI.replaceStarListInDatabase({
            frameId,
            starList
        });
        return response.status;
    }
);


const updateStarList = createAsyncThunk(
    'project/updateStarList',
    async (payload, thunkAPI) => {
        const {storyboardId, frameId, starData} = JSON.parse(payload);
        const {dispatch, getState} = thunkAPI;
        dispatch(updateStarListInMemory(payload));
        const state = getState();
        dispatch(updateUserActionCounter());
        const storyboardData = ProjectDataHandler.getStoryboard(state.project.value, storyboardId);
        const frameData = StoryboardDataHandler.getFrame(storyboardData, frameId);
        const starList =  frameData.starList;
        const response = await ProjectAPI.replaceStarListInDatabase({
            frameId,
            starList: starList
        });
        return response.status;
    }
);


const deleteStar = createAsyncThunk(
    'project/updateStarList',
    async (starId, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        const state = getState();
        const storyboardId = state.project.value.selectedId.storyboardId;
        const frameId = state.project.value.selectedId.frameId
        dispatch(deleteStarInMemory(JSON.stringify({
            storyboardId, frameId, starId
        })));
        dispatch(updateUserActionCounter());
        const storyboardData = ProjectDataHandler.getStoryboard(state.project.value, storyboardId);
        const frameData = StoryboardDataHandler.getFrame(storyboardData, frameId);
        const starList =  frameData.starList;
        const response = await ProjectAPI.replaceStarListInDatabase({
            frameId,
            starList: starList
        });
        return response.status;
    }
);


/* The next section are about backdrop stars on on the frame */
const addBackdropStar = createAsyncThunk(
    'project/addBackdropStar',
    async (prototypeId, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        const state = getState();
        const storyboardId = state.project.value.selectedId.storyboardId;
        const frameId = state.project.value.selectedId.frameId
        console.log("storyboardId: ", storyboardId)
        console.log("frameId: ", frameId)
        if (storyboardId === null || frameId === null) {return;}
        if (storyboardId === "UNDEFINED" || frameId === "UNDEFINED") {return;}
        dispatch(addBackdropStarInMemory(JSON.stringify({
            storyboardId, frameId, prototypeId,
        })));
        dispatch(updateUserActionCounter());
        setTimeout(() => {
            dispatch(updateUserActionCounter());
        }, 500)

        const storyboardData = ProjectDataHandler.getStoryboard(state.project.value, storyboardId);
        const frameData = StoryboardDataHandler.getFrame(storyboardData, frameId);
        const backdropStar =  frameData.backdropStar;

        //sometimes the first dispatch does not work, because the actor is not yet fully updated on the canvas.
        const response = await ProjectAPI.replaceBackdropStarInDatabase({
            frameId,
            backdropStar
        });
        return response.status;
    }
);


/* The next section are about template stars on on the frame */
const addTemplateStar = createAsyncThunk(
    'project/addBackdropStar',
    async (templateId, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        const state = getState();
        const storyboardId = state.project.value.selectedId.storyboardId;
        const frameId = state.project.value.selectedId.frameId
        console.log("storyboardId: ", storyboardId)
        console.log("frameId: ", frameId)
        if (storyboardId === null || frameId === null) {return;}
        if (storyboardId === "UNDEFINED" || frameId === "UNDEFINED") {return;}
        dispatch(addTemplateStarInMemory(JSON.stringify({
            storyboardId, frameId, templateId,
        })));
        dispatch(updateUserActionCounter());
        setTimeout(() => {
            dispatch(updateUserActionCounter());
        }, 500)
        //sometimes the first dispatch does not work, because the actor is not yet fully updated on the canvas.

        return "OK";
    }
);


/* The next section are about actors:
 */

const addActor = createAsyncThunk(
    'project/addActor',
    async (text, thunkAPI) => {
        const {dispatch, getState}  = thunkAPI;
        const actorId = UUID.v4();
        console.log("actorId: ", actorId);
        const actorDataJSON = ActorDataHandler.initializeActor(actorId);
        const state = getState();
        const projectId = state.project.value._id;
        const payload =  JSON.stringify({
            projectId,
            actorDataJSON
        });
        dispatch(addActorInMemory(payload));
        const response = await ProjectAPI.addActor(payload);
        return response.status;
    }
)

const deleteActor = createAsyncThunk(
    'project/deleteActor',
    async (actorId, thunkAPI) => {
        console.log("actorID: ", actorId);
        const {dispatch, getState} = thunkAPI;
        dispatch(deleteActorInMemory(actorId));
        const state = getState();
        const projectId = state.project.value._id;
        const actorIdList = state.project.value.actorList.map(a=>a._id);
        const response = await ProjectAPI.replaceActorIdListInDatabase({
            projectId, actorIdList
        });
        return response.status;
    }
);

const updateActorOrder = createAsyncThunk(
    'project/updateActorOrder',
    async (text, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        dispatch(updateActorOrderInMemory(text));
        const state = getState();
        const projectId = state.project.value._id;
        const actorIdList = state.project.value.actorList.map(a=>a._id);
        const response = await ProjectAPI.replaceActorIdListInDatabase({
            projectId, actorIdList
        });
        return response.status;
    }
);

const updateActorName = createAsyncThunk(
    'project/updateActorName',
    async (payload, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        dispatch(updateActorNameInMemory(JSON.stringify(payload)));
        const response = await ProjectAPI.updateActorName(payload);
        return response.status;
    }
);

/* The next section are about states:
 */

const addState = createAsyncThunk(
    'project/addState',
    async (payload, thunkAPI) => {
        const {actorId} = payload
        const {dispatch, getState} = thunkAPI;
        dispatch(addStateInMemory(JSON.stringify(payload)));
        const stateList = ProjectDataHandler.stateList(getState().project.value, actorId);
        const response = await ProjectAPI.replaceStateListInDatabase({
            actorId,
            stateList
        });
        return response.status;
    }
);

const deleteState = createAsyncThunk(
    'project/deleteState',
    async (payload, thunkAPI) => {
        const {actorId} = payload
        const {dispatch, getState} = thunkAPI;
        dispatch(deleteStateInMemory(JSON.stringify(payload)));
        const stateList = ProjectDataHandler.stateList(getState().project.value, actorId);
        const response = await ProjectAPI.replaceStateListInDatabase({
            actorId,
            stateList
        });
        return response.status;
    }
);

const updateStateName = createAsyncThunk(
    'project/updateStateName',
    async (payload, thunkAPI) => {
        const {actorId} = payload
        const {dispatch, getState} = thunkAPI;
        dispatch(updateStateNameInMemory(JSON.stringify(payload)));
        const stateList = ProjectDataHandler.stateList(getState().project.value, actorId);
        const response = await ProjectAPI.replaceStateListInDatabase({
            actorId,
            stateList
        });
        return response.status;
    }
);


// The next session is about backdrops

const addBackdrop = createAsyncThunk(
    'project/addBackdrop',
    async (backdropId, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        const projectId = getState().project.value._id;
        dispatch(addBackdropInMemory(
                backdropId)
        );
        const backdropList = getState().project.value.backdropList;
        const response = await ProjectAPI.replaceBackdropListInDatabase({
            projectId, backdropList
        });
        return response.status;
    }
);

const deleteBackdrop = createAsyncThunk(
    'project/deleteBackdrop',
    async (backdropId, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        const projectId = getState().project.value._id;
        dispatch(deleteBackdropInMemory(
            backdropId)
        );
        const backdropList = getState().project.value.backdropList;
        const response = await ProjectAPI.replaceBackdropListInDatabase({
            projectId, backdropList
        });
        return response.status;
    }
);

const updateBackdropName = createAsyncThunk(
    'project/updateStateName',
    async (payload, thunkAPI) => {
        const {backdropId, backdropName} = payload
        const {dispatch, getState} = thunkAPI;
        const projectId = getState().project.value._id;
        dispatch(updateBackdropNameInMemory(JSON.stringify({
            backdropId, backdropName
        })));
        const backdropList = getState().project.value.backdropList;
        const response = await ProjectAPI.replaceBackdropListInDatabase({
            projectId, backdropList
        });
        return response.status;
    }
);

const saveNote = createAsyncThunk(
    'project/saveNote',
    async (text, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        dispatch(saveNoteInMemory(text));
        const storyboardId = getState().project.value.selectedId.storyboardId;
        const response = await ProjectAPI.saveNote({
            storyboardId,
           text
        });

        return response.status;
    }
);


export const projectSlice = createSlice({
    name: 'project',
    initialState: {
        value: null,
    },
    reducers: {

        updateNameInMemory: {
            reducer: (state, action) => {
                state.value.name = action.payload;
            }
        },

        /* The next section is about selected IDs */
//         // SelectedIdDataHandler.setStoryboardId(project.selectedId, storyboardData);
//         dispatch(setSelectedFrameId(storyboardData));
//
// //although adding storyboard automatically set frame IDs, we should do it again because sometimes redux does not recognize it being updated.
// if (storyboardData.frameList.length > 0){
//     dispatch(setSelectedFrameId(storyboardData.frameList[0]._id));
//     // SelectedIdDataHandler.setFrameId(project.selectedId, storyboardData.frameList[0]._id);
// }

        setSelectedStoryboardIdInMemory: {
            reducer: (state, action) => {
                SelectedIdDataHandler.setStoryboardId(state.value.selectedId, action.payload);
            }
        },

        setSelectedFrameIdInMemory : {
            reducer: (state, action) => {
                SelectedIdDataHandler.setFrameId(state.value.selectedId, action.payload);
            }
        },

        /* The next section are about storyboards:
        */

        addStoryboardInMemory: {
            reducer: (state, action) => {
                const {type, storyboardDataJSON} = JSON.parse(action.payload);
                ProjectDataHandler.addStoryboard(state.value, type, storyboardDataJSON);
            }
        },

        deleteStoryboardInMemory: {
            reducer: (state, action) =>
            {
                let menuIndex = -1;
                for (const type of ["final", "draft"]) {
                    menuIndex = state.value.storyboardMenu[type].items.findIndex(
                        a => a._id === action.payload
                    )
                    if (menuIndex !== -1) {
                        state.value.storyboardMenu[type].items.splice(menuIndex, 1);
                        break;
                    }
                }
                const storyboardIndex = state.value.storyboardList.findIndex(
                    a => a._id === action.payload
                )
                const storyboardData = state.value.storyboardList[storyboardIndex];
                for (const frameId of storyboardData.frameList) {
                    const templateIndex = state.value.templateList.indexOf(frameId);
                    if (templateIndex !== -1) {
                        state.value.templateList.splice(templateIndex, 1);
                    }
                }
                state.value.storyboardList.splice(storyboardIndex, 1);
            }
        },

        updateStoryboardOrderInMemory: {
            reducer: (state, action) => {
                ProjectDataHandler.updateStoryboardOrder(state.value, action.payload);
            },
        },

        updateStoryboardNameInMemory: {
            reducer: (state, action) => {
                const {_id, name} = action.payload;
                ProjectDataHandler.updateStoryboardName(
                    state.value, _id, name
                )
            },
            prepare: (text) => {
                const obj = JSON.parse(text);
                return {
                    payload: {
                        "_id": obj._id,
                        "name": obj.name,
                    }
                }
            },
        },

        /* The next section are about frames:
        */

        addFrameInMemory: {
            reducer: (state, action) => {
                const storyboard = ProjectDataHandler.getStoryboard(state.value, action.payload.storyboardId);
                StoryboardDataHandler.addFrame(
                    storyboard,
                    action.payload.newId,
                    action.payload.prevIndex,
                )
                state.value.templateList.unshift(action.payload.newId);
                console.log("storyboard!!!!!!!!!!!!!!!!!!!!!!: ", storyboard);
            },
            prepare: (text) => {
                const obj = JSON.parse(text);
                return {
                    payload: {
                        "storyboardId": obj.storyboardId,
                        "prevIndex": obj.prevIndex,
                        "newId": obj.newId,
                    }
                }
            },
        },

        updateFrameListInMemory: {
            reducer: (state, action) => {
                const {storyboardId, frameIndex} = JSON.parse(action.payload);
                // const storyboard = state.value.getStoryboard(storyboardId);
                // storyboard.frameList = frameList;
                const frameList = ProjectDataHandler.getStoryboard(state.value, storyboardId).frameList;
                const frameId = frameList[frameIndex]._id;
                const templateIndex = state.value.templateList.indexOf(frameId);
                state.value.templateList.splice(templateIndex, 1);

                console.log("frameList!!!!!!!!!!!!!!!!!!!!!!: ", frameList);

                frameList.splice(frameIndex, 1);
            }
        },



        /* the next section is about stars */

        addStarInMemory: {
            reducer: (state, action) => {
                const storyboardData = ProjectDataHandler.getStoryboard(state.value, action.payload.storyboardId);
                const frameData = StoryboardDataHandler.getFrame(storyboardData, action.payload.frameId);
                FrameDataHandler.addStar(frameData, action.payload.stateId);
            },
            prepare: (text) => {
                const obj = JSON.parse(text);
                return {
                    payload: {
                        "storyboardId": obj.storyboardId,
                        "frameId": obj.frameId,
                        "stateId": obj.stateId,
                    }
                }
            },
        },


        updateStarListInMemory: {
            reducer: (state, action) => {
                const storyboardData = ProjectDataHandler.getStoryboard(state.value, action.payload.storyboardId);
                const frame = StoryboardDataHandler.getFrame(storyboardData, action.payload.frameId);
                const starIndex = frame.starList.findIndex(s => s._id === action.payload.starData._id);
                console.log("starIndex: ", starIndex);
                if (starIndex !== -1) {
                    frame.starList[starIndex] =  action.payload.starData;
                }
            },
            prepare: (text) => {
                const obj = JSON.parse(text);
                return {
                    payload: {
                        "storyboardId": obj.storyboardId,
                        "frameId": obj.frameId,
                        "starData": obj.starData,
                    }
                }
            },
        },


        deleteStarInMemory: {
            reducer: (state, action) => {
                const storyboardData = ProjectDataHandler.getStoryboard(state.value, action.payload.storyboardId);
                const frame = StoryboardDataHandler.getFrame(storyboardData, action.payload.frameId);
                FrameDataHandler.deleteStar(frame, action.payload.starId);
            },
            prepare: (text) => {
                const obj = JSON.parse(text);
                return {
                    payload: {
                        "storyboardId": obj.storyboardId,
                        "frameId": obj.frameId,
                        "starId": obj.starId,
                    }
                }
            },
        },

        //        dispatch(addBackdropStarInMemory(JSON.stringify({
        //             storyboardId, frameId, backdropId,
        //         })));

        addBackdropStarInMemory: {
            reducer: (state, action) => {
                const storyboardData = ProjectDataHandler.getStoryboard(state.value, action.payload.storyboardId);
                const frame = StoryboardDataHandler.getFrame(storyboardData, action.payload.frameId);
                frame.backdropStar =  {
                    "_id": UUID.v4(),
                    "prototypeId": action.payload.prototypeId,
                };
            },
            prepare: (text) => {
                const obj = JSON.parse(text);
                return {
                    payload: {
                        "storyboardId": obj.storyboardId,
                        "frameId": obj.frameId,
                        "prototypeId": obj.prototypeId,
                    }
                }
            },
        },

        addTemplateStarInMemory: {
            reducer: (state, action) => {
                const {storyboardId, frameId, templateId} = action.payload;
                const storyboardData = ProjectDataHandler.getStoryboard(state.value, storyboardId);
                const frame = StoryboardDataHandler.getFrame(storyboardData, frameId);
                const templateFrame = ProjectDataHandler.findFrame(state.value, templateId);
                FrameDataHandler.acquireFrame(frame, templateFrame);
            },
            prepare: (text) => {
                const obj = JSON.parse(text);
                return {
                    payload: {
                        "storyboardId": obj.storyboardId,
                        "frameId": obj.frameId,
                        "templateId": obj.templateId,
                    }
                }
            },
        },


        /* The next section are about actors:
        */

        addActorInMemory: {
            reducer: (state, action) => {
                const {actorDataJSON} = JSON.parse(action.payload);
                ProjectDataHandler.addActor(state.value, actorDataJSON);
            }
        },

        deleteActorInMemory: {
            reducer: (state, action) => {
                const actorIndex = state.value.actorList.findIndex(
                    a => a._id === action.payload
                )
                state.value.actorList.splice(actorIndex, 1)
            }
        },

        updateActorOrderInMemory: {
            reducer: (state, action) => {
                ProjectDataHandler.updateActorOrder(state.value, action.payload.beginOrder, action.payload.endOrder);
            },
            prepare: (text) => {
                const obj = JSON.parse(text);
                return {
                    payload: {
                        "beginOrder": obj.beginOrder,
                        "endOrder": obj.endOrder,
                    }
                }
            },
        },

        updateActorNameInMemory: {
            reducer: (state, action) => {
                state.value.actorList.find(
                    a => a._id === action.payload._id
                ).name = action.payload.name;
            },
            prepare: (text) => {
                const obj = JSON.parse(text);
                return {
                    payload: {
                        "_id": obj._id,
                        "name": obj.name,
                    }
                }
            },
        },

        /* The next section are about states:
        */

        addStateInMemory: {
            reducer: (state, action) => {
                const actor = state.value.actorList.find(a => a._id === action.payload.actorId);
                ActorDataHandler.addState(
                    actor,
                    action.payload.stateId
                )
            },
            prepare: (text) => {
                const obj = JSON.parse(text);
                return {
                    payload: {
                        "actorId": obj.actorId,
                        "stateId": obj.stateId,
                    }
                }
            },
        },

        deleteStateInMemory: {
            reducer: (state, action) => {
                ProjectDataHandler.deleteState(state.value, action.payload.actorId, action.payload.stateId);
            },
            prepare: (text) => {
                const obj = JSON.parse(text);
                return {
                    payload: {
                        "actorId": obj.actorId,
                        "stateId": obj.stateId,
                    }
                }
            },
        },

        updateStateNameInMemory: {
            reducer: (state, action) => {
                const actor = state.value.actorList.find(
                    a => a._id === action.payload.actorId
                )
                const stateIndex = actor.stateList.findIndex(s => s._id === action.payload.stateId);
                actor.stateList[stateIndex].name = action.payload.stateName;
            },
            prepare: (text) => {
                const obj = JSON.parse(text);
                return {
                    payload: {
                        "actorId": obj.actorId,
                        "stateId": obj.stateId,
                        "stateName": obj.stateName
                    }
                }
            },
        },

        /* The next section are about backdrops:
        */


        addBackdropInMemory: {
            reducer: (state, action) => {
                state.value.backdropList.push(BackdropDataHandler.initializeBackdrop(action.payload))
            }
        },

        deleteBackdropInMemory: {
            reducer: (state, action) => {
                const backdropIndex = state.value.backdropList.findIndex(b => b._id === action.payload);
                state.value.backdropList.splice(backdropIndex, 1);
            }
        },

        updateBackdropNameInMemory: {
            reducer: (state, action) => {
                const backdropIndex = state.value.backdropList.findIndex(s => s._id === action.payload.backdropId);
                state.value.backdropList[backdropIndex].name = action.payload.backdropName;
            },
            prepare: (text) => {
                const obj = JSON.parse(text);
                return {
                    payload: {
                        "backdropId": obj.backdropId,
                        "backdropName": obj.backdropName,
                    }
                }
            },
        },






        saveNoteInMemory: {
          reducer: (state, action) => {
              state.value.note = action.payload
          }
        },



        download: {
            reducer: (state) => {
                ProjectDataHandler.download(state.value);
            }
        }
    },
    extraReducers: {
        [loadProjectFromDatabase.fulfilled]: (state, action) => {
            console.log("action payload", action.payload);
            state.value = ProjectDataHandler.initializeProject(action.payload);
            console.log("parsed project: ", state.value);
        },
    }
});

// Action creators are generated for each case reducer function
export const {
    updateNameInMemory, //project
    setSelectedFrameIdInMemory, setSelectedStoryboardIdInMemory, //selectedId
    addStoryboardInMemory, deleteStoryboardInMemory, updateStoryboardOrderInMemory, updateStoryboardNameInMemory, //storyboard
    addStarInMemory, updateStarListInMemory, deleteStarInMemory, //star
    addBackdropStarInMemory, //backdropStar
    addTemplateStarInMemory, //templateStar
    addFrameInMemory, updateFrameListInMemory, //frame
    addActorInMemory, deleteActorInMemory, updateActorOrderInMemory, updateActorNameInMemory, //actor
    addStateInMemory, deleteStateInMemory, updateStateNameInMemory, //state
    addBackdropInMemory, deleteBackdropInMemory, updateBackdropNameInMemory, //backdrop
    saveNoteInMemory, //note
    download,
} = projectSlice.actions;
export {
    insertEmptyProjectToDatabase, loadProjectFromDatabase, updateName, //project
    setSelectedStoryboardId, setSelectedFrameId, setSelectedStarId, //selectedId
    addStoryboard, deleteStoryboard, updateStoryboardOrder, updateStoryboardName, //storyboard
    addFrame, deleteFrame, //frame
    addStar, updateStarList, deleteStar, //star
    addBackdropStar, //backdropStar
    addTemplateStar, //templateSar,
    addActor, deleteActor, updateActorOrder, updateActorName, //actor
    addState, deleteState, updateStateName, //state
    addBackdrop, deleteBackdrop, updateBackdropName, //backdrop
    saveNote, //note
};
export default projectSlice.reducer;
