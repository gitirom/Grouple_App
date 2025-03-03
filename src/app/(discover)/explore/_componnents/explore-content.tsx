"use client"

import { useAppSelector } from "@/redux/store"
import dynamic from "next/dynamic"
import ExploreSlider from "./explore-slider"

type Props = {
    layout: "SLIDER" | "LIST"
    category?: string
}

const SearchGroups = dynamic(
    () =>
        import("./searched-groups").then(
            (components) => components.SearchGroups,
        ),
    {
        ssr: false,
    },
)

const ExplorePageContent = ({ layout, category }: Props) => {
    const { isSearching, data, status, debounce } = useAppSelector(
        (state) => state.searchReducer,
    )
    return (
        <div className="flex flex-col ">
            {isSearching || debounce ? (
                <SearchGroups
                    searching={isSearching as boolean}
                    data={data}
                    query={debounce} //a technique used to limit the number of times a function (like a search request) is called within a short period.
                />
            ) : (
                status !== 200 &&
                (layout === "SLIDER" ? (
                    <>
                        <ExploreSlider
                            label="Fitness"
                            text="Join top performing groups on grouple."
                            query="fitness"
                        />
                        <ExploreSlider
                            label="Lifestyle"
                            text="Join top performing groups on grouple."
                            query="lifestyle"
                        />
                        <ExploreSlider
                            label="Music"
                            text="Join top performing groups on grouple."
                            query="music"
                        />
                    </>
                ) : (
                    <></>
                ))
            )}
        </div>
    )
}

export default ExplorePageContent
