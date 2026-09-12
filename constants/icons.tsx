import * as React from "react";
import { StyleProp, Text, ViewStyle } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

export interface IconProps {
	color?: string;
	size?: number;
	style?: StyleProp<ViewStyle>;
}

export interface ChevronProps extends IconProps {
	direction?: "up" | "down" | "left" | "right";
}

export const ChevronIcon = ({ color = "#000000", size = 24, direction = "left", style }: ChevronProps) => {
	const getPath = () => {
		switch (direction) {
			case "up":
				return "M6 15L12 9L18 15";
			case "right":
				return "M9 6L15 12L9 18";
			case "down":
				return "M6 9L12 15L18 9";
			case "left":
			default:
				return "M15 6L9 12L15 18";
		}
	};

	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
			<Path d={getPath()} stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
		</Svg>
	);
};

export const BellDisabledIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M18.9986 13.9274V9.99737C18.9986 6.14737 15.5586 2.99737 11.3086 2.99737C9.99058 2.99247 8.69071 3.30457 7.5186 3.90737L18.9986 14.7374C18.9986 14.7374 18.9986 14.4874 18.9986 13.9274Z" fill={color} />
		<Path fillRule="evenodd" clipRule="evenodd" d="M3.8586 2.48735L22.5286 19.7174H22.5386C22.7887 19.9985 22.8599 20.3963 22.7227 20.7467C22.5855 21.0971 22.2631 21.3408 21.8886 21.3774C21.6477 21.3813 21.4147 21.2917 21.2386 21.1274L19.2386 19.2474H14.1086C14.1086 20.9042 12.7655 22.2474 11.1086 22.2474C9.45175 22.2474 8.1086 20.9042 8.1086 19.2474H4.5686C3.68478 19.3323 2.84447 18.8469 2.47655 18.0388C2.10863 17.2307 2.29422 16.2782 2.9386 15.6674C3.36126 15.291 3.60471 14.7533 3.6086 14.1874V9.47735C3.66098 8.21064 4.03618 6.97833 4.6986 5.89735L2.5586 3.89735C2.17571 3.70898 1.95453 3.2984 2.00788 2.87503C2.06123 2.45166 2.37736 2.10879 2.79501 2.0213C3.21266 1.93382 3.63982 2.12099 3.8586 2.48735ZM9.5486 19.2574C9.59121 20.0765 10.2684 20.7185 11.0886 20.7174V20.7074C11.9013 20.7035 12.5711 20.0687 12.6186 19.2574H9.5486Z" fill={color} />
	</Svg>
);

export const BellIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path fillRule="evenodd" clipRule="evenodd" d="M20.4066 13.97C20.4094 14.5511 20.6649 15.1023 21.1066 15.48C22.6166 16.83 21.5466 19.14 19.4066 19.14H15.6066C15.114 20.4844 13.8383 21.3814 12.4066 21.39C10.9702 21.3962 9.68678 20.4938 9.20657 19.14H5.40657C3.26657 19.14 2.19657 16.83 3.70657 15.48C4.1482 15.1023 4.40369 14.5511 4.40657 13.97V9.14C4.40657 5.2 7.98657 2 12.4066 2C16.8266 2 20.4066 5.2 20.4066 9.14V13.97ZM10.8866 19.14C11.2505 19.611 11.8114 19.8878 12.4066 19.89C12.9877 19.8756 13.5314 19.6001 13.8866 19.14H10.8866Z" fill={color} />
	</Svg>
);

export const BinIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path fillRule="evenodd" clipRule="evenodd" d="M18.75 5H16.08L14.87 3.68C14.4271 3.24459 13.8311 3.00041 13.21 3H10.29C9.65816 3.00529 9.05413 3.26056 8.61 3.71L7.42 5H4.75C4.33579 5 4 5.33579 4 5.75C4 6.16421 4.33579 6.5 4.75 6.5H18.75C19.1642 6.5 19.5 6.16421 19.5 5.75C19.5 5.33579 19.1642 5 18.75 5ZM9.69 4.74C9.8496 4.58138 10.065 4.49163 10.29 4.49H13.21C13.4257 4.48936 13.6334 4.57171 13.79 4.72L14.04 4.99H9.46L9.69 4.74ZM4.23 9.52V17C4.23 19.4632 6.22681 21.46 8.69 21.46H14.81C17.2732 21.46 19.27 19.4632 19.27 17V9.52C19.27 8.41543 18.3746 7.52 17.27 7.52H6.27C5.73267 7.50925 5.21363 7.71521 4.82986 8.09145C4.44609 8.4677 4.22989 8.98256 4.23 9.52ZM9.5 13.05C9.5 13.4642 9.16421 13.8 8.75 13.8C8.33579 13.8 8 13.4642 8 13.05V10.68C8 10.2658 8.33579 9.93 8.75 9.93C9.16421 9.93 9.5 10.2658 9.5 10.68V13.05ZM11.75 17.75C12.1642 17.75 12.5 17.4142 12.5 17V10.68C12.5 10.2658 12.1642 9.93 11.75 9.93C11.3358 9.93 11 10.2658 11 10.68V17C11 17.4142 11.3358 17.75 11.75 17.75ZM15.5 13.05C15.5 13.4642 15.1642 13.8 14.75 13.8C14.3358 13.8 14 13.4642 14 13.05V10.68C14 10.2658 14.3358 9.93 14.75 9.93C15.1642 9.93 15.5 10.2658 15.5 10.68V13.05Z" fill={color} />
	</Svg>
);

export const CalendarIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path fillRule="evenodd" clipRule="evenodd" d="M16.9 3.57H17C19.7614 3.57 22 5.80858 22 8.57V17.57C22 20.3314 19.7614 22.57 17 22.57H7C5.67392 22.57 4.40215 22.0432 3.46447 21.1055C2.52678 20.1679 2 18.8961 2 17.57V8.57C2 5.80858 4.23858 3.57 7 3.57H7.1V1.75C7.1 1.33579 7.43579 1 7.85 1C8.26421 1 8.6 1.33579 8.6 1.75V3.57H15.4V1.75C15.4 1.33579 15.7358 1 16.15 1C16.5642 1 16.9 1.33579 16.9 1.75V3.57ZM7.5 9.66H16.5C16.9142 9.66 17.25 9.32421 17.25 8.91C17.25 8.49579 16.9142 8.16 16.5 8.16H7.5C7.08579 8.16 6.75 8.49579 6.75 8.91C6.75 9.32421 7.08579 9.66 7.5 9.66Z" fill={color} />
	</Svg>
);

export const ClockIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path fillRule="evenodd" clipRule="evenodd" d="M10 2H14.24C16.3617 2 18.3966 2.84285 19.8969 4.34315C21.3971 5.84344 22.24 7.87827 22.24 10V14.24C22.24 18.6583 18.6583 22.24 14.24 22.24H10C5.58172 22.24 2 18.6583 2 14.24V10C2 5.58172 5.58172 2 10 2ZM12.12 18.12C12.6723 18.12 13.12 17.6723 13.12 17.12V12.12C13.1215 11.8542 13.0172 11.5987 12.83 11.41L8.83 7.41C8.57634 7.15634 8.20663 7.05728 7.86012 7.15012C7.51362 7.24297 7.24297 7.51362 7.15012 7.86012C7.05728 8.20663 7.15634 8.57634 7.41 8.83L11.12 12.53V17.12C11.12 17.6723 11.5677 18.12 12.12 18.12Z" fill={color} />
	</Svg>
);

export const FlameIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M12.0511 2L10.6811 4.8C9.70212 6.80035 8.39008 8.61962 6.80107 10.18L6.62107 10.35C5.60054 11.3408 5.01743 12.6977 5.00107 14.12V14.3C4.97404 17.0851 6.63368 19.6101 9.20107 20.69L9.46107 20.8C11.1449 21.5152 13.0472 21.5152 14.7311 20.8H14.7911C17.3777 19.6762 19.0372 17.1099 19.0011 14.29V9.95C18.1391 11.9185 16.5737 13.4946 14.6111 14.37C14.6111 14.37 14.6111 14.37 14.5511 14.37C14.4911 14.37 13.7911 14.66 13.4911 14.37C13.2231 14.0989 13.1975 13.6712 13.4311 13.37L13.5011 13.32H13.5511C15.8468 11.575 16.3821 8.34172 14.7711 5.95C13.4711 3.97 12.0511 2 12.0511 2Z" fill={color} />
	</Svg>
);

export const HomeIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path fillRule="evenodd" clipRule="evenodd" d="M14.4537 3.8032L19.4558 7.49793C20.4198 8.1956 20.9934 9.31112 21 10.5011V17.1895C20.938 19.3342 19.1566 21.0268 17.0116 20.979H6.99789C4.8492 21.032 3.06195 19.338 3 17.1895V10.5011C3.00659 9.31112 3.58019 8.1956 4.54421 7.49793L9.54632 3.8032C11.0068 2.73227 12.9932 2.73227 14.4537 3.8032ZM7.73684 16.9716H16.2632C16.6556 16.9716 16.9737 16.6535 16.9737 16.2611C16.9737 15.8687 16.6556 15.5506 16.2632 15.5506H7.73684C7.34443 15.5506 7.02632 15.8687 7.02632 16.2611C7.02632 16.6535 7.34443 16.9716 7.73684 16.9716Z" fill={color} />
	</Svg>
);

export const PlusFilledIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path fillRule="evenodd" clipRule="evenodd" d="M11.44 2H12.56C17.7736 2 22 6.22643 22 11.44V12.56C22 17.7736 17.7736 22 12.56 22H11.44C6.22643 22 2 17.7736 2 12.56V11.44C2 6.22643 6.22643 2 11.44 2ZM12.75 12.75H16C16.4142 12.75 16.75 12.4142 16.75 12C16.75 11.5858 16.4142 11.25 16 11.25H12.75V8C12.75 7.58579 12.4142 7.25 12 7.25C11.5858 7.25 11.25 7.58579 11.25 8V11.25H8C7.58579 11.25 7.25 11.5858 7.25 12C7.25 12.4142 7.58579 12.75 8 12.75H11.25V16C11.25 16.4142 11.5858 16.75 12 16.75C12.4142 16.75 12.75 16.4142 12.75 16V12.75Z" fill={color} />
	</Svg>
);

export function PlusIcon({ size = 24, color = "black", ...props }: IconProps) {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
			<Path d="M20.5 11H15C14.4477 11 14 10.5523 14 10V4.5C14 3.67157 13.3284 3 12.5 3C11.6716 3 11 3.67157 11 4.5V10C11 10.5523 10.5523 11 10 11H4.5C3.67157 11 3 11.6716 3 12.5C3 13.3284 3.67157 14 4.5 14H10C10.5523 14 11 14.4477 11 15V20.5C11 21.3284 11.6716 22 12.5 22C13.3284 22 14 21.3284 14 20.5V15C14 14.4477 14.4477 14 15 14H20.5C21.3284 14 22 13.3284 22 12.5C22 11.6716 21.3284 11 20.5 11Z" fill={color} />
		</Svg>
	);
}

export const TickIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M8.94631 18.2346C8.59988 18.2344 8.26421 18.1142 7.99631 17.8946L3.51631 14.2246C2.90372 13.6924 2.8254 12.7696 3.33954 12.1418C3.85368 11.514 4.77384 11.4089 5.41631 11.9046L8.88631 14.7446L18.8863 5.53459C19.2622 5.08766 19.8633 4.8995 20.4269 5.05234C20.9905 5.20518 21.4142 5.67123 21.5128 6.24682C21.6114 6.82241 21.3669 7.40289 20.8863 7.73459L9.96631 17.8346C9.69 18.0935 9.32496 18.2367 8.94631 18.2346Z" fill={color} />
	</Svg>
);

export const SkipIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M21 10.27L15.7 7.21C15.0815 6.85291 14.3195 6.85272 13.7009 7.20948C13.0822 7.56625 12.7007 8.22583 12.7 8.94V10.87C12.5389 10.6242 12.3234 10.4189 12.07 10.27L6.70999 7.21C6.09151 6.85291 5.32955 6.85272 4.71088 7.20948C4.09221 7.56625 3.71072 8.22583 3.70999 8.94V15.06C3.71072 15.7742 4.09221 16.4337 4.71088 16.7905C5.32955 17.1473 6.09151 17.1471 6.70999 16.79L12 13.73C12.2534 13.5811 12.4689 13.3758 12.63 13.13V15.06C12.6307 15.7742 13.0122 16.4337 13.6309 16.7905C14.2495 17.1473 15.0115 17.1471 15.63 16.79L21 13.73C21.6168 13.3722 21.9965 12.7131 21.9965 12C21.9965 11.2869 21.6168 10.6278 21 10.27Z" fill={color} />
	</Svg>
);

export const CancelIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M19.7188 18.3906L13.325 12.0004L19.7188 5.65714C20.0392 5.28603 20.0219 4.72911 19.679 4.37894C19.3361 4.02878 18.7832 4.00341 18.4101 4.32073L11.9976 10.6169L5.69734 4.27367C5.33275 3.90878 4.74392 3.90878 4.37933 4.27367C4.20236 4.45039 4.10282 4.69094 4.10282 4.94188C4.10282 5.19282 4.20236 5.43337 4.37933 5.61008L10.6703 11.9439L4.2765 18.2777C4.09954 18.4544 4 18.695 4 18.9459C4 19.1969 4.09954 19.4374 4.2765 19.6141C4.45291 19.7903 4.69172 19.8885 4.94018 19.887C5.18409 19.8885 5.41891 19.794 5.59452 19.6235L11.9976 13.2709L18.4101 19.7271C18.5865 19.9032 18.8253 20.0014 19.0738 20C19.319 19.9989 19.554 19.9009 19.7281 19.7271C19.9039 19.5491 20.0017 19.3078 20 19.0569C19.9982 18.8059 19.897 18.5661 19.7188 18.3906Z" fill={color} />
	</Svg>
);

export const EditIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M13.24 15.62L9.83 16.35C9.69707 16.3646 9.56294 16.3646 9.43 16.35C8.95699 16.3541 8.50246 16.1665 8.17 15.83C7.74274 15.3917 7.56592 14.7672 7.7 14.17L8.43 10.77C8.58508 10.1015 8.93275 9.49303 9.43 9.02001L15.13 3.32001H6.13C5.01465 3.30645 3.94101 3.74355 3.15228 4.53228C2.36354 5.32102 1.92645 6.39465 1.94 7.51001V17.86C1.94 20.1465 3.79354 22 6.08 22H16.44C18.7265 22 20.58 20.1465 20.58 17.86V9.07001L15 14.66C14.5195 15.1448 13.9077 15.4785 13.24 15.62Z" fill={color} />
		<Path fillRule="evenodd" clipRule="evenodd" d="M16.77 3.11001C17.9273 1.78227 19.9367 1.63079 21.28 2.77001C21.843 3.41829 22.1238 4.26458 22.06 5.12084C21.9961 5.9771 21.5929 6.7724 20.94 7.33001L14.27 14C13.9182 14.3328 13.4767 14.5552 13 14.64L9.62001 15.4C9.34192 15.4811 9.04186 15.3992 8.84347 15.1882C8.64507 14.9771 8.58191 14.6726 8.68001 14.4L9.41001 11C9.52154 10.5369 9.76057 10.1142 10.1 9.78001L16.77 3.11001ZM17.18 7.77001L19.42 5.53001C19.6954 5.2345 19.6872 4.774 19.4016 4.48839C19.116 4.20278 18.6555 4.19465 18.36 4.47001L16.12 6.71001C15.8276 7.00283 15.8276 7.4772 16.12 7.77001C16.4128 8.06247 16.8872 8.06247 17.18 7.77001Z" fill={color} />
	</Svg>
);

export const SproutIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M21 3V5C21 11.0751 16.0751 16 10 16H9V22H7V16H6C4.34315 16 3 14.6569 3 13V9H5C8.31371 9 11 11.6863 11 15C13.2536 14.9392 15.3411 13.9161 16.7351 12.2223C15.3341 12.396 13.9575 11.7583 13.1119 10.6094C11.9547 9.03664 12.29 6.8211 13.8627 5.66392C14.8876 4.91004 16.2081 4.7088 17.4087 5.1118L18.4239 3.25049C19.1678 3.12513 19.9882 3 21 3Z" fill={color} />
	</Svg>
);

export const TimerIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path fillRule="evenodd" clipRule="evenodd" d="M19.8014 5.55C19.802 6.39361 19.5004 7.20953 18.9514 7.85L17.1214 9.93C16.012 11.2476 16.012 13.1724 17.1214 14.49L18.9114 16.62C19.7883 17.6671 19.9803 19.127 19.404 20.3652C18.8277 21.6035 17.5872 22.3966 16.2214 22.4H8.52138C7.15377 22.4005 5.90965 21.6089 5.33084 20.3698C4.75203 19.1307 4.94331 17.6685 5.82138 16.62L7.63138 14.46C8.73057 13.1538 8.73057 11.2462 7.63138 9.94L5.82138 7.78C4.94331 6.7315 4.75203 5.26932 5.33084 4.03024C5.90965 2.79115 7.15377 1.99948 8.52138 2H16.2814C17.2202 1.99997 18.1201 2.37494 18.7811 3.04157C19.4421 3.7082 19.8094 4.61125 19.8014 5.55ZM9.62138 18.46H15.1814C15.4496 18.4922 15.7124 18.3673 15.8567 18.1389C16.001 17.9105 16.001 17.6195 15.8567 17.3911C15.7124 17.1627 15.4496 17.0378 15.1814 17.07H9.62138C9.35317 17.0378 9.09036 17.1627 8.94607 17.3911C8.80179 17.6195 8.80179 17.9105 8.94607 18.1389C9.09036 18.3673 9.35317 18.4922 9.62138 18.46Z" fill={color} />
	</Svg>
);

export const UserIcon = ({ size = 24, color = "black", style }: IconProps) => {
	return (
		<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
			<Path d="M16.64 22H7.36C6.34918 21.9632 5.40757 21.477 4.79235 20.6741C4.17713 19.8713 3.95257 18.8356 4.18 17.85L4.42 16.71C4.69604 15.1668 6.02262 14.0327 7.59 14H16.41C17.9774 14.0327 19.304 15.1668 19.58 16.71L19.82 17.85C20.0474 18.8356 19.8229 19.8713 19.2077 20.6741C18.5924 21.477 17.6508 21.9632 16.64 22Z" fill={color} />
			<Path d="M12.5 12H11.5C9.29088 12 7.50001 10.2092 7.50001 8.00001V5.36001C7.49735 4.46807 7.85049 3.61189 8.48119 2.98119C9.11189 2.35049 9.96807 1.99735 10.86 2.00001H13.14C14.032 1.99735 14.8881 2.35049 15.5188 2.98119C16.1495 3.61189 16.5027 4.46807 16.5 5.36001V8.00001C16.5 9.06088 16.0786 10.0783 15.3284 10.8284C14.5783 11.5786 13.5609 12 12.5 12Z" fill={color} />
		</Svg>
	);
};

export const CloudSyncIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path fillRule="evenodd" clipRule="evenodd" d="M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04ZM19 18H6C3.79 18 2 16.21 2 14C2 11.95 3.53 10.24 5.56 10.03L6.63 9.92L7.13 8.97C8.08 7.14 9.94 6 12 6C14.62 6 16.88 7.86 17.39 10.43L17.69 11.93L19.22 12.04C20.78 12.14 22 13.45 22 15C22 16.65 20.65 18 19 18ZM13 9V12H15.5L12 16L8.5 12H11V9H13Z" fill={color} />
	</Svg>
);

export const GoogleIcon = ({ size = 20 }: { size?: number }) => (
	<Svg width={size} height={size} viewBox="0 0 24 24">
		<Path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
		<Path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
		<Path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
		<Path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
	</Svg>
);

export const ListViewIcon = ({ color = "#000000", size = 20, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
	</Svg>
);

export const GridViewIcon = ({ color = "#000000", size = 20, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M4 4H10V10H4V4ZM14 4H20V10H14V4ZM4 14H10V20H4V14ZM14 14H20V20H14V14Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</Svg>
);

export const CardViewIcon = ({ color = "#000000", size = 20, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z" stroke={color} strokeWidth="2" strokeLinecap="round" />
		<Path d="M4 10H20" stroke={color} strokeWidth="2" strokeLinecap="round" />
	</Svg>
);

export const SearchIcon = ({ color = "#000000", size = 20, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		<Path d="M21 21L16.65 16.65" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</Svg>
);

export const SunOldIcon = ({ color = "#000000", size = 20, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
		<Path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</Svg>
);

export const SunsetIcon = ({ color = "#000000", size = 20, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M17 18C17 15.2386 14.7614 13 12 13C9.23858 13 7 15.2386 7 18M12 9V2M4.22 10.22L5.64 11.64M1 18H23M4 22H20M19.78 10.22L18.36 11.64" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</Svg>
);

export const MoonOldIcon = ({ color = "#000000", size = 20, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
	</Svg>
);

export const SparklesIcon = ({ color = "#000000", size = 20, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z" fill={color} />
		<Path d="M19 16L19.9 18.1L22 19L19.9 19.9L19 22L18.1 19.9L16 19L18.1 18.1L19 16Z" fill={color} />
	</Svg>
);

export const DefaultHabitIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={style}>
		<Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" fill={color} />
	</Svg>
);

export const ActivityIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} fill="none" viewBox="0 0 24 24" style={style}>
		<Path fill={color} fillRule="evenodd" d="M10 2h4.24a8 8 0 0 1 8 8v4.24a8 8 0 0 1-8 8H10a8 8 0 0 1-8-8V10a8 8 0 0 1 8-8m6.39 10.87h1.73v.03a.75.75 0 0 0 0-1.5h-1.75a1.94 1.94 0 0 0-1.38.57l-2.15 2.15v-5a1 1 0 0 0-1.79-.79l-2.88 2.9a.45.45 0 0 1-.33.14H6.12a.75.75 0 0 0 0 1.5h1.72a2 2 0 0 0 1.39-.58l2.1-2.15v5a1 1 0 0 0 .65 1 .9.9 0 0 0 .4.08 1.05 1.05 0 0 0 .74-.31L16.07 13a.48.48 0 0 1 .32-.13" clipRule="evenodd" />
	</Svg>
);
export const BookIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} fill="none" viewBox="0 0 24 24" style={style}>
		<Path fill={color} d="M20.26 14.83V6.75A3.75 3.75 0 0 0 16.51 3H7.75A3.75 3.75 0 0 0 4 6.75v10.54a3.21 3.21 0 0 0 3.21 3.21h12.3a.75.75 0 0 0 0-1.5H7.21a1.71 1.71 0 0 1 0-3.42h12.3a.75.75 0 0 0 .75-.75" />
		<Path fill={color} d="M7.21 16.54a.75.75 0 0 0 0 1.5h11.07a.75.75 0 0 0 0-1.5z" />
	</Svg>
);
export const HeartIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} fill="none" viewBox="0 0 24 24" style={style}>
		<Path fill={color} d="M22.1 9.1C22 5.7 19.3 3 15.9 3c-1.1 0-2.8.8-3.5 2.1-.1.3-.5.3-.6 0-.8-1.2-2.4-2-3.6-2-3.3 0-6.1 2.7-6.2 6v.2c0 1.7.7 3.3 1.9 4.5v.1c.1.1 4.9 4.3 7.1 6.2.6.5 1.5.5 2.1 0 2.2-1.9 6.9-6.1 7.1-6.2v-.1c1.2-1.1 1.9-2.7 1.9-4.5z" />
	</Svg>
);
export const LampIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} fill="none" viewBox="0 0 24 24" style={style}>
		<Path fill={color} fillRule="evenodd" d="M12.35 7.12a5 5 0 0 0-5.11 5 5.1 5.1 0 0 0 .95 3 8 8 0 0 1 1.59 4.62 2.52 2.52 0 0 0 5 0 7 7 0 0 1 1.41-4.44 5 5 0 0 0 1.09-3 5.1 5.1 0 0 0-4.93-5.18m1 12.31h-2.26a.76.76 0 0 1 0-1.5h2.3a.76.76 0 0 1 0 1.5zm1.58-7.47a.75.75 0 0 0 .73.76l.04.01a.74.74 0 0 0 .73-.73 4 4 0 0 0-3.94-4.07.75.75 0 0 0 0 1.5 2.55 2.55 0 0 1 2.44 2.53" clipRule="evenodd" />
		<Path fill={color} d="M12.28 6.21a.76.76 0 0 0 .75-.75V2.75a.75.75 0 1 0-1.5 0v2.71a.76.76 0 0 0 .75.75M19.59 4.87a.75.75 0 0 0-1.06 0l-1.87 1.86a.75.75 0 0 0 1.06 1.06l1.87-1.86a.75.75 0 0 0 0-1.06M21.63 11.03H19a.75.75 0 0 0 0 1.5h2.63a.75.75 0 0 0 0-1.5M5.38 11.03H2.75a.75.75 0 0 0 0 1.5h2.63a.75.75 0 0 0 0-1.5M7.79 7.79a.74.74 0 0 0 0-1.06L5.93 4.87a.75.75 0 1 0-1.06 1.06l1.86 1.86c.14.142.33.221.53.22a.73.73 0 0 0 .53-.22" />
	</Svg>
);
export const LightningIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} fill="none" viewBox="0 0 24 24" style={style}>
		<Path fill={color} d="m11.605 3.507-5.45 9.55a1.13 1.13 0 0 0 1 1.7h2.86a1.38 1.38 0 0 1 1.39 1.38v3.61a1 1 0 0 0 1.83.55l5.28-7.92a1.14 1.14 0 0 0-.94-1.77h-2.72a1.38 1.38 0 0 1-1.38-1.38v-5.22a1 1 0 0 0-1.87-.5" />
	</Svg>
);
export const MoonIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} fill="none" viewBox="0 0 24 24" style={style}>
		<Path fill={color} d="M22.16 12.08c0 5.567-4.513 10.08-10.08 10.08S2 17.647 2 12.08 6.513 2 12.08 2a9.4 9.4 0 0 1 2.2.25 6.17 6.17 0 1 0 7.63 7.63c.17.721.254 1.46.25 2.2" />
	</Svg>
);
export const MugIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} fill="none" viewBox="0 0 24 24" style={style}>
		<Path fill={color} fillRule="evenodd" d="M7 4h11.82a2.63 2.63 0 0 1 2.5 2.75v4a2.63 2.63 0 0 1-2.5 2.75h-1.43v2a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4m-.46 10.91a.8.8 0 0 0 .53.22.8.8 0 0 0 .53-.22l5.62-5.61a.75.75 0 0 0-1.06-1.06l-5.62 5.61a.75.75 0 0 0 0 1.06m6.68-1.16-1.15 1.11a.73.73 0 0 1-.52.21.78.78 0 0 1-.54-.23.75.75 0 0 1 0-1.06l1.15-1.03a.75.75 0 0 1 1.06 0 .75.75 0 0 1 0 1m5.6-1.75a1.15 1.15 0 0 0 1-1.25v-4a1.15 1.15 0 0 0-1-1.25h-2.33a4 4 0 0 1 .9 2.5v4z" clipRule="evenodd" />
	</Svg>
);

export const StarIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} fill="none" viewBox="0 0 24 24" style={style}>
		<Path fill={color} d="m14.44 4.537.66 2a2.25 2.25 0 0 0 2.13 1.56h2.08a2.24 2.24 0 0 1 1.32 4.06l-1.71 1.24a2.25 2.25 0 0 0-.82 2.51l.66 2a2.24 2.24 0 0 1-3.45 2.54l-1.68-1.25a2.25 2.25 0 0 0-2.64 0l-1.68 1.25a2.24 2.24 0 0 1-3.45-2.51l.66-2a2.25 2.25 0 0 0-.82-2.51l-1.75-1.26a2.24 2.24 0 0 1 1.36-4.07h2.08a2.25 2.25 0 0 0 2.13-1.54l.66-2a2.24 2.24 0 0 1 4.26-.02" />
	</Svg>
);

export const SunIcon = ({ color = "#000000", size = 24, style }: IconProps) => (
	<Svg width={size} height={size} fill="none" viewBox="0 0 24 24" style={style}>
		<Circle cx={11.75} cy={11.75} r={5} fill={color} />
		<Path fill={color} d="M11.75 5.5a.76.76 0 0 0 .75-.75v-3a.75.75 0 0 0-1.5 0v3a.76.76 0 0 0 .75.75M11.75 18a.76.76 0 0 0-.75.75v3a.75.75 0 0 0 1.5 0v-3a.76.76 0 0 0-.75-.75M6.27 7.33a.75.75 0 0 0 1.06-1.06L5.21 4.15a.75.75 0 1 0-1.06 1.06zM17.23 16.17a.75.75 0 0 0-1.06 1.06l2.12 2.12a.74.74 0 0 0 .53.22.75.75 0 0 0 .53-1.28zM5.5 11.75a.76.76 0 0 0-.75-.75h-3a.75.75 0 0 0 0 1.5h3a.76.76 0 0 0 .75-.75M21.75 11h-3a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5M6.27 16.17l-2.12 2.12a.75.75 0 0 0 1.06 1.06l2.12-2.12a.75.75 0 0 0-1.06-1.06M16.75 7.55c.2.001.39-.078.53-.22l2.07-2.12a.75.75 0 1 0-1.06-1.06l-2.12 2.12a.75.75 0 0 0 .58 1.28" />
	</Svg>
);

// ─── Icon Name → Component Map ────────────────────────────────────────────────
// Maps icon name strings (stored in DB / templates) to their SVG components.
// The special string "🌱" renders the sprout emoji (the only allowed emoji).
// Unknown strings fall back to DefaultHabitIcon.

const ICON_MAP: Record<string, React.ComponentType<IconProps>> = {
	ActivityIcon: ActivityIcon,
	BookIcon: BookIcon,
	HeartIcon: HeartIcon,
	MugIcon: MugIcon,
	FlameIcon: FlameIcon,
	StarIcon: StarIcon,
	LampIcon: LampIcon,
	LightningIcon: LightningIcon,
	MoonIcon: MoonIcon,
	SunIcon: SunIcon,
	SproutIcon: SproutIcon,
	ClockIcon: ClockIcon,
	BellDisabledIcon: BellDisabledIcon,
	SparklesIcon: SparklesIcon,
	CalendarIcon: CalendarIcon,
	TimerIcon: TimerIcon,
	TickIcon: TickIcon,
	EditIcon: EditIcon,
	DefaultHabitIcon: DefaultHabitIcon,
};

/**
 * Renders a habit icon given its stored name.
 * - "🌱" → renders the sprout emoji (the ONLY allowed emoji).
 * - Any recognised icon name → renders the corresponding SVG icon.
 * - Fallback → DefaultHabitIcon.
 */
export function renderHabitIcon(
	iconName: string | null | undefined,
	color: string = "#1C1C1E",
	size: number = 24
): React.ReactNode {
	if (!iconName || iconName === "🌱" || iconName === "SproutIcon") {
		return <SproutIcon color={color} size={size} />;
	}
	const IconComponent = ICON_MAP[iconName];
	if (IconComponent) {
		return <IconComponent color={color} size={size} />;
	}
	// Unknown name — fallback
	return <DefaultHabitIcon color={color} size={size} />;
}

/**
 * Returns the list of all available icon names (for pickers).
 */
export const ALL_ICON_NAMES = Object.keys(ICON_MAP) as (keyof typeof ICON_MAP)[];