import { createSlice, PayloadAction } from "@reduxjs/toolkit"


type InitialStateProps = {
    members: {
        id: string
    }[]
} 

const InitialState : InitialStateProps = {
    members: []
}

export const OnlineTracking = createSlice({
    name: 'online',
    initialState: InitialState,
    reducers: {
        onOnline: (state, action: PayloadAction<InitialStateProps>) => {
            // Check for duplicate members by comparing ids
            const list = state.members.find((data: any) =>     //to check if any member in action.payload.members already exists in state.members.
                action.payload.members.find((payload: any) => data.id === payload.id),
            )
            if (!list) state.members = [...state.members, ...action.payload.members]
        },
        onOffline: (state, action: PayloadAction<InitialStateProps>) => {
            // Filter out members who are present in the action payload, effectively removing them
            state.members = state.members.filter((member) => //Removes members from the members list who are found in the action.payload.members.
                action.payload.members.find((m) => member.id !== m.id),
            )
        },
    }
})

export const { onOffline, onOnline } = OnlineTracking.actions

export default OnlineTracking.reducer