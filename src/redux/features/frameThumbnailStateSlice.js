import {createAsyncThunk, createSlice} from '@reduxjs/toolkit'
import {ProjectAPI} from "../../api/ProjectAPI";
import {loadProjectFromDatabase, updateStarListInMemory} from "./projectSlice";
import {ProjectData} from "../../data/ProjectData";


const sendFrameImg = createAsyncThunk(
    'frameThumbnailState/sendFrameImg',
    async (payload, thunkAPI) => {
        const {_id, img} = payload;
        const response = await ProjectAPI.sendFrameImg({_id, img});
        return response.status;
    }
)

const sendEmptyFrameImg = createAsyncThunk(
    'frameThumbnailState/sendTransparentFrameImg',
    async (newId, thunkAPI) => {
        const response = await ProjectAPI.sendFrameImg({
            _id: newId,
            img: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAQAAAAe/WZNAAAADklEQVR42mNkgAJGDAYAAFEABCaLYqoAAAAASUVORK5CYII=",
        });
        return response.status;
    }
)

const copyPreviousFrameImg = createAsyncThunk(
    'frameThumbnailState/sendTransparentFrameImg',
    async (payload, thunkAPI) => {
        console.log("dispatching: ", payload)
        const newId = payload;
        const {getState} = thunkAPI;
        const project = getState().project.value;
        console.log("project: ", project);
        const storyboardId = project.selectedId.storyboardId;
        console.log("storyboardId: ", storyboardId);
        const frameList = project.getStoryboard(storyboardId).frameList;
        console.log("frameList: ", frameList);
        const prevId = frameList[frameList.length-1]._id;
        console.log("------!_!_!_!_!_!!_ prevId, newId: ", prevId, newId);
        const response = await ProjectAPI.requestCopyFrameImg(
            {
                fromId: prevId,
                toId: newId
            }
        )
        return response.status;
    }
)


export const frameThumbnailStateSlice = createSlice({
    name: 'frameThumbnailState',
    initialState: {
        value: {
            userActionCounter: 0,
            serverActionCounter: 0,
        }
    },
    reducers: {
        updateUserActionCounter: (state, action) => {
            state.value.userActionCounter = state.value.userActionCounter + 1;
        }
    },
    extraReducers: {
        [sendFrameImg.fulfilled]: (state, action) => {
            state.value.serverActionCounter = state.value.serverActionCounter + 1;
        },
        [sendEmptyFrameImg.fulfilled]: (state, action) => {
            state.value.serverActionCounter = state.value.serverActionCounter + 1;
        },
        [copyPreviousFrameImg.fulfilled]: (state, action) => {
            state.value.serverActionCounter = state.value.serverActionCounter + 1;
        },
    }
})

// Action creators are generated for each case reducer function
export const { updateUserActionCounter } = frameThumbnailStateSlice.actions
export {sendFrameImg, sendEmptyFrameImg, copyPreviousFrameImg}
export default frameThumbnailStateSlice.reducer
