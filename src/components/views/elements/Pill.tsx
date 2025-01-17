/*
Copyright 2017 - 2019, 2021 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import React, { ReactElement } from "react";
import classNames from "classnames";
import { Room, RoomMember } from "matrix-js-sdk/src/matrix";
import { Tooltip } from "@vector-im/compound-web";
import { MatrixClientPeg } from "matrix-react-sdk/src/MatrixClientPeg";
import MatrixClientContext from "matrix-react-sdk/src/contexts/MatrixClientContext";
import { usePermalink } from "matrix-react-sdk/src/hooks/usePermalink";
import RoomAvatar from "matrix-react-sdk/src/components/views/avatars/RoomAvatar";
import MemberAvatar from "matrix-react-sdk/src/components/views/avatars/MemberAvatar";
import { _t } from "matrix-react-sdk/src/languageHandler";
import { Icon as LinkIcon } from "matrix-react-sdk/res/img/element-icons/room/composer/link.svg";
import { Icon as UserIcon } from "matrix-react-sdk/res/img/compound/user.svg";

import { Icon as TokenGatedRoomIcon } from "../../../../res/themes/superhero/img/icons/tokengated-room.svg";
import { isVerifiedRoom } from "../../../hooks/useVerifiedRoom";
import { Icon as CommunityRoomIcon } from "../../../../res/themes/superhero/img/icons/community-room.svg";
import { getSafeRoomName } from "../../../hooks/useRoomName";

export enum PillType {
    UserMention = "TYPE_USER_MENTION",
    RoomMention = "TYPE_ROOM_MENTION",
    AtRoomMention = "TYPE_AT_ROOM_MENTION", // '@room' mention
    EventInSameRoom = "TYPE_EVENT_IN_SAME_ROOM",
    EventInOtherRoom = "TYPE_EVENT_IN_OTHER_ROOM",
}

export const pillRoomNotifPos = (text: string | null): number => {
    return text?.indexOf("@room") ?? -1;
};

export const pillRoomNotifLen = (): number => {
    return "@room".length;
};

const linkIcon = <LinkIcon className="mx_Pill_LinkIcon mx_BaseAvatar" />;

const PillRoomAvatar: React.FC<{
    shouldShowPillAvatar: boolean;
    room: Room | null;
}> = ({ shouldShowPillAvatar, room }) => {
    if (!shouldShowPillAvatar) {
        return null;
    }

    if (room) {
        return <RoomAvatar room={room} size="16px" aria-hidden="true" />;
    }
    return linkIcon;
};

const PillMemberAvatar: React.FC<{
    shouldShowPillAvatar: boolean;
    member: RoomMember | null;
}> = ({ shouldShowPillAvatar, member }) => {
    if (!shouldShowPillAvatar) {
        return null;
    }

    if (member) {
        return <MemberAvatar member={member} size="16px" aria-hidden="true" hideTitle />;
    }
    return <UserIcon className="mx_Pill_UserIcon mx_BaseAvatar" />;
};

export interface PillProps {
    // The Type of this Pill. If url is given, this is auto-detected.
    type?: PillType;
    // The URL to pillify (no validation is done)
    url?: string;
    /** Whether the pill is in a message. It will act as a link then. */
    inMessage?: boolean;
    // The room in which this pill is being rendered
    room?: Room;
    // Whether to include an avatar in the pill
    shouldShowPillAvatar?: boolean;
}

export const Pill: React.FC<PillProps> = ({ type: propType, url, inMessage, room, shouldShowPillAvatar = true }) => {
    const { event, member, onClick, resourceId, targetRoom, text, type } = usePermalink({
        room,
        type: propType,
        url,
    });

    if (!type || !text) {
        return null;
    }

    const classes = classNames("mx_Pill", {
        mx_AtRoomPill: type === PillType.AtRoomMention,
        mx_RoomPill: type === PillType.RoomMention,
        mx_SpacePill: type === "space" || targetRoom?.isSpaceRoom(),
        mx_UserPill: type === PillType.UserMention,
        mx_UserPill_me: resourceId === MatrixClientPeg.safeGet().getUserId(),
        mx_EventPill: type === PillType.EventInOtherRoom || type === PillType.EventInSameRoom,
    });

    let avatar: ReactElement | null = null;
    let pillText: string | null = text;

    switch (type) {
        case PillType.EventInOtherRoom:
            {
                avatar = <PillRoomAvatar shouldShowPillAvatar={shouldShowPillAvatar} room={targetRoom} />;
                pillText = _t("pill|permalink_other_room", {
                    room: text,
                });
            }
            break;
        case PillType.EventInSameRoom:
            {
                if (event) {
                    avatar = <PillMemberAvatar shouldShowPillAvatar={shouldShowPillAvatar} member={member} />;
                    pillText = _t("pill|permalink_this_room", {
                        user: text,
                    });
                } else {
                    avatar = linkIcon;
                    pillText = _t("common|message");
                }
            }
            break;
        case PillType.AtRoomMention:
        case PillType.RoomMention:
        case "space":
            avatar = <PillRoomAvatar shouldShowPillAvatar={shouldShowPillAvatar} room={targetRoom} />;
            break;
        case PillType.UserMention:
            avatar = <PillMemberAvatar shouldShowPillAvatar={shouldShowPillAvatar} member={member} />;
            break;
        default:
            return null;
    }

    const isAnchor = !!inMessage && !!url;
    const { isCommunityRoom, isTokenGatedRoom } = isVerifiedRoom(pillText);

    const renderPillText = (): ReactElement => {
        return (
            <>
                {isCommunityRoom ? (
                    <>
                        <CommunityRoomIcon className="sh_RoomTokenGatedRoomIcon" style={{ marginLeft: "2px" }} />
                        <span>$</span>
                    </>
                ) : null}
                {isTokenGatedRoom ? (
                    <TokenGatedRoomIcon className="sh_RoomTokenGatedRoomIcon" style={{ marginLeft: "2px" }} />
                ) : null}
                <span className="mx_Pill_text">{getSafeRoomName(pillText || "")}</span>
            </>
        );
    };
    return (
        <bdi>
            <MatrixClientContext.Provider value={MatrixClientPeg.safeGet()}>
                <Tooltip
                    label={resourceId ?? ""}
                    open={resourceId ? undefined : false}
                    side="right"
                    isTriggerInteractive={isAnchor}
                >
                    {isAnchor ? (
                        <a className={classes} href={url} onClick={onClick}>
                            {avatar}
                            {renderPillText()}
                        </a>
                    ) : (
                        <span className={classes}>
                            {avatar}
                            {renderPillText()}
                        </span>
                    )}
                </Tooltip>
            </MatrixClientContext.Provider>
        </bdi>
    );
};
