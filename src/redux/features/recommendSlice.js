import { createSlice} from '@reduxjs/toolkit'
import {ProjectDataHandler} from "../../data/ProjectData";



export const recommendSlice = createSlice({
    name: 'recommendSlice',
    initialState: {
        value: {
            initial: [],
            selected: null,
            modified: null,
            modifiedCostumes: [],
            modifiedBackdrops: [],
        },
    },
    reducers: {
        resetRecommend: (state) => {
            state.value.initial = []
        },

        addRecommend: (state, action) => {
            state.value.initial.push(action.payload);
        },

        setSelectedRecommend: (state, action) => {
            const selected = action.payload;
            state.value.selected = selected;
            state.value.modifiedCostumes = [];
            state.value.modifiedBackdrops = [];
            state.value.modified = JSON.parse(JSON.stringify(selected));
        },

        setModifiedRecommend: (state, action) => {
            state.value.modified = action.payload
        },

        modifyRecommend: (state, action) => {
            const {actorId, stateId, newActorId, newStateId} = action.payload;
            state.value.modifiedCostumes.push(newStateId);
            ProjectDataHandler.swapCostume(state.value.modified, actorId, stateId, newActorId, newStateId);
            console.log("modified: ", state.value.modified);
        },
        modifyRecommendBackdrop: (state, action) => {
            const {stateId, newStateId} = action.payload;
            state.value.modifiedBackdrops.push(newStateId);
            ProjectDataHandler.swapBackdrop(state.value.modified, stateId, newStateId);
            console.log("modified: ", state.value.modified);
        }
    },
})

export const { resetRecommend, addRecommend, setSelectedRecommend, setModifiedRecommend, modifyRecommend, modifyRecommendBackdrop } = recommendSlice.actions
export default recommendSlice.reducer
