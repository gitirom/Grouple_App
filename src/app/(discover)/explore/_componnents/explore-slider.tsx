import Skeleton from "@/components/global/skeleton"
import { Slider } from "@/components/global/slider"
import { useExploreSlider, useGroupList } from "@/hooks/groups"
import { useAppSelector } from "@/redux/store"
import { SwiperSlide } from "swiper/react"
import GroupCard from "./group-card"

type Props = {
    query: string
    label: string
    text: string
}

const ExploreSlider = ({ query, label, text }: Props) => {
    const { groups, status } = useGroupList(query)
    const {
        refetch,
        isFetching,
        data: fetchedData,
        onLoadSlider,
    } = useExploreSlider(query, groups && groups.length)

    //accessing the Redux state using
    const { data } = useAppSelector((state) => state.infiniteScrollReducer)

    return (
        status === 200 &&
        groups.length > 0 &&
        onLoadSlider && (
            <div className="flex flex-col mt-16 ">
                <div className="flex flex-col px-[40px] lg:px-[150px] ">
                    <h2 className="text-2xl font-bold text-white ">{label}</h2>
                    <p className="text-sm text-themeTextGray">{text}</p>
                </div>
                <Slider
                    freeMode
                    className="flex"
                    spaceBetween={50}
                    autoHeight
                    onReachEnd={() => refetch}
                    breakpoints={{
                        200: {
                            slidesPerView: 1.2,
                            slidesOffsetBefore: 40,
                            slidesOffsetAfter: 40,
                        },
                        820: {
                            slidesPerView: 2.4,
                            slidesOffsetBefore: 40,
                            slidesOffsetAfter: 40,
                        },
                        1024: {
                            slidesPerView: 3.2,
                            slidesOffsetBefore: 150,
                            slidesOffsetAfter: 150,
                        },
                        1280: {
                            slidesPerView: 4.3,
                            slidesOffsetBefore: 150,
                            slidesOffsetAfter: 150,
                        },
                        1540: {
                            slidesPerView: 5.6,
                            slidesOffsetBefore: 150,
                            slidesOffsetAfter: 150,
                        },
                    }}
                >
                    {groups.map((group) => (
                        <SwiperSlide key={group.id}> 
                            <GroupCard {...group} />
                        </SwiperSlide>
                    ))}
                    
                    {/* if the user swipe the slider untell the end, refetch likely makes an API call to get more groups. */}
                    {fetchedData?.status === 200 &&
                        data.map((group: any) => (
                            <SwiperSlide key={group.id}>
                                <GroupCard {...group} />
                            </SwiperSlide>
                        ))
                    }
                    {/* displays a loading skeleton inside a SwiperSlide */}
                    {isFetching && (
                        <SwiperSlide>
                            <Skeleton element="CARD" />
                        </SwiperSlide>
                    )}
                </Slider>
            </div>
        )
    )
}

export default ExploreSlider
