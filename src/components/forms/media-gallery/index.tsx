
type Props = {
    groupid: string
}

const MediaGalleryForm = ({groupid}: Props) => {
    const { errors, register, onUpdateGallery, isPending } = useMediaGallery(groupid)
    return (
        <div>{groupid}</div>
    )
}

export default MediaGalleryForm