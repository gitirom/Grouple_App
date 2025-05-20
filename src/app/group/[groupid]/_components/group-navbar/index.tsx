"use client"

import { Card, CardContent } from "@/components/ui/card"
import { GROUPLE_CONSTANTS } from "@/constants"
import { useNavigation } from "@/hooks/navigation"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useParams } from "next/navigation"

type MenuProps = {
    orientation: "mobile" | "desktop"
}

const Menu = ({ orientation }: MenuProps) => {
    const { section, onSetSection } = useNavigation()
    const params = useParams()
    const groupid = params.groupid as string
    const channelid = params.channelid as string
    
    //transform path if needed for getting navigate to the group page not to the home 
    const getPath = (path: string) => {
        if (path === '/') {
            return `/group/${groupid}/channel/${channelid}`
        }
        return path
    }
    
    switch (orientation) {
        case "desktop":
            return (
                <Card className="bg-themeGray border-themeGray bg-clip-padding backdrop--blur__safari backdrop-filter backdrop-blur-2xl bg-opacity-60 p-1 lg:flex  md:rounded-xl flex items-center justify-center w-fit">
                    <CardContent className="p-0 flex gap-2">
                        {GROUPLE_CONSTANTS.groupPageMenu.map((menuItem) => (
                            <Link
                                href={getPath(menuItem.path)}
                                onClick={() => onSetSection(getPath(menuItem.path))}
                                className={cn(
                                    "rounded-xl flex gap-2 py-2 px-4 items-center",
                                    section == getPath(menuItem.path)
                                        ? "bg-[#09090B] border-[#27272A]"
                                        : "",
                                )}
                                key={menuItem.id}
                            >
                                {section == getPath(menuItem.path) && menuItem.icon}
                                {menuItem.label}
                            </Link>
                        ))}
                    </CardContent>
                </Card>
            )

        case "mobile":
            return (
                <div className="flex flex-col mt-10">
                    {GROUPLE_CONSTANTS.groupPageMenu.map((menuItem) => (
                        <Link
                            href={getPath(menuItem.path)}
                            onClick={() => onSetSection(getPath(menuItem.path))}
                            className={cn(
                                "rounded-xl flex gap-2 py-2 px-4 items-center",
                                section == getPath(menuItem.path)
                                    ? "bg-themeGray border-[#27272A]"
                                    : "",
                            )}
                            key={menuItem.id}
                        >
                            {menuItem.icon}
                            {menuItem.label}
                        </Link>
                    ))}
                </div>
            )
        default:
            return <></>
    }
}

export default Menu
