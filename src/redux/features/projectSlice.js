import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import {ProjectData} from "../../data/ProjectData";
import {StoryboardData} from "../../data/StoryboardData";
import {DashboardAPI} from "../../api/DashboardAPI";
import {DashboardAPIData} from "../../data/DashboardData/DashboardAPIData";
import {ProjectAPI} from "../../api/ProjectAPI";
import Cookies from "js-cookie";
import * as UUID from "uuid";
import {ActorData} from "../../data/ActorData";
import globalConfig from "../../globalConfig";
import {StarData} from "../../data/StarData";
import {setSelectedStar} from "./selectedStarSlice";
import {
    copyPreviousFrameImg,
    sendEmptyFrameImg,
    sendFrameImg,
    updateUserActionCounter
} from "./frameThumbnailStateSlice";






const insertEmptyProjectToDatabase = createAsyncThunk(
    'project/insertNewProjectToDatabase',
    async (text, thunkAPI) => {
        const {newProjectId, newProjectName} = JSON.parse(text);
        const projectData = new ProjectData(newProjectId, newProjectName);
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
        const storyboardData = project.getStoryboard(storyboardId);

        project.selectedId.setStoryboardId(storyboardData);

        //although adding storyboard automatically set frame IDs, we should do it again because sometimes redux does not recognize it being updated.
        if (storyboardData.frameList.length > 0){
            project.selectedId.setFrameId(storyboardData.frameList[0]._id);
        }

        //this is also because frame thumbnail does not update.
        setTimeout( () => {
                dispatch(updateUserActionCounter());
            }, 500
        )

        const response = await ProjectAPI.updateSelectedIdData(
            {
                projectId: project._id,
                selectedId: project.selectedId.toJSON()
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
        project.selectedId.setFrameId(frameId);
        const response = await ProjectAPI.updateSelectedIdData(
            {
                projectId: project._id,
                selectedId: project.selectedId.toJSON()
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
        project.selectedId.setStarId(starId);
        const response = await ProjectAPI.updateSelectedIdData(
            {
                projectId: project._id,
                selectedId: project.selectedId.toJSON()
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
        const storyboardData = new StoryboardData(storyboardId, storyboardName)
        const storyboardDataJSON = storyboardData.toJSON();
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
        const frameList = project.getStoryboard(storyboardId).frameList;
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
        console.log("===============frameList: ", frameList);
        const response = await ProjectAPI.insertFrameAndReplaceFrameListInDatabase({
            storyboardId,
            frameId,
            frameList,
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
            frameIdList: project.getStoryboard(storyboardId).frameList.map(f => f._id)
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
        setTimeout(() => {
            dispatch(updateUserActionCounter());
        }, 500)
        //sometimes the first dispatch does not work, because the actor is not yet fully updated on the canvas.
        const starList = state.project.value.getStoryboard(storyboardId).getFrame(frameId).starListJSON();
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
        const starList = state.project.value.getStoryboard(storyboardId).getFrame(frameId).starListJSON();
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
        const starList = state.project.value.getStoryboard(storyboardId).getFrame(frameId).starListJSON();
        const response = await ProjectAPI.replaceStarListInDatabase({
            frameId,
            starList: starList
        });
        return response.status;
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
        const actorDataJSON = new ActorData(actorId).toJSON();
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
        const stateList = getState().project.value.stateListJSON(actorId);
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
        const stateList = getState().project.value.stateListJSON(actorId);
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
        const stateList = getState().project.value.stateListJSON(actorId);
        const response = await ProjectAPI.replaceStateListInDatabase({
            actorId,
            stateList
        });
        return response.status;
    }
);

const saveNote = createAsyncThunk(
    'project/saveNote',
    async (text, thunkAPI) => {
        const {dispatch, getState} = thunkAPI;
        dispatch(saveNoteInMemory(text));
        const projectId = getState().project.value._id;
        const response = await ProjectAPI.saveNote({
            projectId,
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

        /* The next section are about storyboards:
        */

        addStoryboardInMemory: {
            reducer: (state, action) => {
                const {type, storyboardDataJSON} = JSON.parse(action.payload);
                state.value.addStoryboard(type, storyboardDataJSON);
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
                state.value.storyboardList.splice(storyboardIndex, 1)
            }
        },

        updateStoryboardOrderInMemory: {
            reducer: (state, action) => {
                state.value.updateStoryboardOrder(action.payload)
            },
        },

        updateStoryboardNameInMemory: {
            reducer: (state, action) => {
                const {_id, name} = action.payload;
                state.value.updateStoryboardName(_id, name);
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
                const storyboard = state.value.getStoryboard(action.payload.storyboardId);
                storyboard.addFrame(
                    action.payload.newId,
                    action.payload.prevIndex,
                )
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
                const frameList = state.value.getStoryboard(storyboardId).frameList;
                frameList.splice(frameIndex, 1);
                console.log("frameList!!!!!!!!!!!!!!!!!!!!!!: ", frameList);
            }
        },

        // deleteFrameInMemory: {
        //     reducer: (state, action) => {
        //         const {storyboardId, frameId} = action.payload
        //         const storyboardData = state.value.getStoryboard(storyboardId);
        //         const frameList = storyboardData === undefined? []:storyboardData.frameList;
        //         const frameIndex = frameList.findIndex(f => f._id === frameId);
        //         if (frameIndex !== -1) {
        //             frameList.splice(frameIndex, 1);
        //         }
        //         if (frameIndex < frameList.length) {
        //             console.log("old id: ", frameId)
        //             console.log('frameIndex: ', frameIndex)
        //             console.log('frameList: ', frameList.length)
        //             state.value.selectedId.setFrameId(frameList[frameIndex]._id)
        //             console.log("selected frameID changed")
        //             console.log("new id: ", this.selectedId.frameId)
        //         }
        //         else {
        //             if (frameList.length > 0) {
        //                 console.log('frameIndex: ', frameIndex)
        //                 console.log('frameList: ', frameList.length)
        //                 state.value.selectedId.setFrameId(frameList[frameIndex-1]._id)
        //             }
        //             else {
        //                 console.log('frameIndex: ', frameIndex)
        //                 console.log('frameList: ', frameList.length)
        //                 state.value.selectedId.voidFrameId();
        //             }
        //         }


        //
        //     },
        //     prepare: (text) => {
        //         const obj = JSON.parse(text);
        //         return {
        //             payload: {
        //                 "storyboardId": obj.storyboardId,
        //                 "frameId": obj.frameId,
        //             }
        //         }
        //     },
        // },

        /* the next section is about stars */

        addStarInMemory: {
            reducer: (state, action) => {
                const frame = state.value.getStoryboard(action.payload.storyboardId).getFrame(action.payload.frameId);
                frame.addStar(action.payload.stateId);
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
                const frame = state.value.getStoryboard(action.payload.storyboardId).getFrame(action.payload.frameId);
                const starIndex = frame.starList.findIndex(s => s._id === action.payload.starData._id);
                console.log("starIndex: ", starIndex);
                if (starIndex !== -1) {
                    frame.starList[starIndex] =  StarData.parse(action.payload.starData);
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
                const frame = state.value.getStoryboard(action.payload.storyboardId).getFrame(action.payload.frameId);
                frame.deleteStar(action.payload.starId);
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


        /* The next section are about actors:
        */

        addActorInMemory: {
            reducer: (state, action) => {
                const {actorDataJSON} = JSON.parse(action.payload);
                state.value.addActor(actorDataJSON);
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
                state.value.updateActorOrder(action.payload.beginOrder, action.payload.endOrder);
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
                actor.addState(
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
                state.value.deleteState(action.payload.actorId, action.payload.stateId);
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


        saveNoteInMemory: {
          reducer: (state, action) => {
              state.value.note = action.payload
          }
        },



        download: {
            reducer: (state) => {
                state.value.download();
            }
        }
    },
    extraReducers: {
        [loadProjectFromDatabase.fulfilled]: (state, action) => {
            state.value = ProjectData.parse(action.payload);
            console.log("parsed project: ", state.value);
        },
    }
});

// Action creators are generated for each case reducer function
export const {
    updateNameInMemory, //project
    addStoryboardInMemory, deleteStoryboardInMemory, updateStoryboardOrderInMemory, updateStoryboardNameInMemory, //storyboard
    addStarInMemory, updateStarListInMemory, deleteStarInMemory, //star
    addFrameInMemory, updateFrameListInMemory, //frame
    addActorInMemory, deleteActorInMemory, updateActorOrderInMemory, updateActorNameInMemory, //actor
    addStateInMemory, deleteStateInMemory, updateStateNameInMemory, //state
    saveNoteInMemory, //note
    download,
} = projectSlice.actions;
export {
    insertEmptyProjectToDatabase, loadProjectFromDatabase, updateName, //project
    setSelectedStoryboardId, setSelectedFrameId, setSelectedStarId, //selectedId
    addStoryboard, deleteStoryboard, updateStoryboardOrder, updateStoryboardName, //storyboard
    addFrame, deleteFrame, //frame
    addStar, updateStarList, deleteStar, //star
    addActor, deleteActor, updateActorOrder, updateActorName, //actor
    addState, deleteState, updateStateName, //state
    saveNote, //note
};
export default projectSlice.reducer;
