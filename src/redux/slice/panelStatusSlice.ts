import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Position } from "../../types";

type PanelStatusState = {
    show: boolean,
    position: Position,
    pinning: boolean,
    focusFlag: number
};

const initialState: PanelStatusState = {
    show: false,
    position: { x: 5, y: 5 },
    pinning: false,
    focusFlag: 0
};

export const panelStatusSlice = createSlice({
    name: 'panelStatus',
    initialState,
    reducers: {
        showPanelAndSetPosition: (state, { payload }: PayloadAction<{ position: Position }>) => {
            state.show = true;
            state.position = payload.position;
        },
        hidePanel: (state) => {
            state.show = false;
        },
        callOutPanel: (state) => {
            state.show = true;
            state.focusFlag += 1;
        },
        closePanel: (state) => {
            state.show = false;
            state.pinning = false;
        },
        requestToHidePanel: (state) => {
            state.show = state.pinning;
        },
        setPanelPinning: (state, { payload }: PayloadAction<{ pinning: boolean }>) => {
            state.pinning = payload.pinning;
        }
    }
});

export const { showPanelAndSetPosition, hidePanel, callOutPanel, closePanel, requestToHidePanel, setPanelPinning } = panelStatusSlice.actions;

export default panelStatusSlice.reducer;