"use client"

import { useSearch } from "@/hooks/groups"


type Props = {
    className?: string
    inputStyle?: string
    placeholder?: string
    searchType: "GROUPS" | "POSTS"
    iconStyle?: string
    glass?: boolean
}

const Search = ({ className, inputStyle, placeholder, searchType, iconStyle, glass  }: Props) => {
    const { query, onSearchQuery } = useSearch(searchType)
    return (
        <div>Search</div>
    )
}

export default Search