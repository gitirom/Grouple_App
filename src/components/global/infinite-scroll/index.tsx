"use client"

type Props = {
    action: "GROUPS" | "POSTS",
    children: React.ReactNode,
    identifier: string,
    paginate: number,
    search?: boolean
    loading?: "POST"
}

const InfiniteScrollObserver = ({
    action,
    children,
    identifier,
    paginate,
    search,
    loading
}: Props) => {
    return (
        <div>index</div>
    )
}

export default InfiniteScrollObserver