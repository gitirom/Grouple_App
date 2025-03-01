"use client"

import { useAppSelector } from "@/redux/store"
import SearchGroups from "./searched-groups"

type Props = {
    layout: "SLIDER" | "LIST",
    category?: string
}

// const SearchGroups = dynamic(
//     () => 
//         // impop
// )

const ExplorePageContent = ({layout, category}: Props) => {
    const { isSearching, data, status, debounce } = useAppSelector(
        (state) => state.searchReducer,
    )
    return (
        <div className="flex flex-col ">
            {isSearching || debounce ? (
                <SearchGroups
                    searching={isSearching as boolean}
                    data={data}
                    query={debounce}   //a technique used to limit the number of times a function (like a search request) is called within a short period.
                />
            ) : (
                <></>
            )}
        </div>
    )
}

export default ExplorePageContent