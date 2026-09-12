import {
	type Bridge,
	BridgeConfirm,
	BridgeControl,
	BridgeFormTarget,
	BridgeIcon,
	BridgeLayout,
	BridgePlace,
	BridgeUploadMode,
} from "@serverkgg/bridge";
import { CHANNEL_VARIABLE, VERSION_VARIABLE } from "../install";
import { PACK_EXTENSIONS, PACK_STAGING, PROPERTY_KEYS, WORLD_EXTENSIONS, WORLD_STAGING } from "../shared";

const GAME_MODES: Bridge.Option[] = [
	{
		value: "survival",
		label: {
			ar: "البقاء",
			en: "Survival",
		},
	},
	{
		value: "creative",
		label: {
			ar: "الإبداع",
			en: "Creative",
		},
	},
	{
		value: "adventure",
		label: {
			ar: "المغامرة",
			en: "Adventure",
		},
	},
];

const DIFFICULTIES: Bridge.Option[] = [
	{
		value: "peaceful",
		label: {
			ar: "مسالم",
			en: "Peaceful",
		},
	},
	{
		value: "easy",
		label: {
			ar: "سهل",
			en: "Easy",
		},
	},
	{
		value: "normal",
		label: {
			ar: "عادي",
			en: "Normal",
		},
	},
	{
		value: "hard",
		label: {
			ar: "صعب",
			en: "Hard",
		},
	},
];

const PERMISSION_LEVELS: Bridge.Option[] = [
	{
		value: "visitor",
		label: {
			ar: "زائر",
			en: "Visitor",
		},
	},
	{
		value: "member",
		label: {
			ar: "عضو",
			en: "Member",
		},
	},
	{
		value: "operator",
		label: {
			ar: "أوبريتر",
			en: "Operator",
		},
	},
];

const CHAT_RESTRICTIONS: Bridge.Option[] = [
	{
		value: "None",
		label: {
			ar: "بدون قيود",
			en: "None",
		},
	},
	{
		value: "Dropped",
		label: {
			ar: "يُتجاهل",
			en: "Dropped",
		},
	},
	{
		value: "Disabled",
		label: {
			ar: "مقفل",
			en: "Disabled",
		},
	},
];

const MESSAGE_FIELD: Bridge.Field = {
	key: "message",
	control: BridgeControl.Text,
	label: {
		ar: "الرسالة",
		en: "Message",
	},
	maxLength: 200,
};

const REASON_FIELD: Bridge.Field = {
	key: "reason",
	control: BridgeControl.Text,
	label: {
		ar: "السبب",
		en: "Reason",
	},
	maxLength: 100,
};

const versionTab: Bridge.Tab = {
	id: "version",
	title: {
		ar: "النسخة",
		en: "Version",
	},
	icon: BridgeIcon.Tag,
	sections: [
		{
			layout: BridgeLayout.Form,
			id: "channel",
			title: {
				ar: "نسخة السيرفر",
				en: "Server build",
			},
			help: {
				ar: "اختر تشتغل على النسخة العادية ولا نسخة البريفيو، وثبّت رقم نسخة معيّن لو تبي.",
				en: "Choose the release or the preview build, and pin a specific version if you want one.",
			},
			target: BridgeFormTarget.Variables,
			reinstall: true,
			confirm: BridgeConfirm.Strong,
			confirmText: {
				ar: "بنعيد تركيب السيرفر على النسخة الجديدة. ماباتك وإعداداتك وأدوناتك تبقى مكانها، بس خذ نسخة احتياطية قبل: الماب اللي تفتح على البريفيو ما ترجع للنسخة العادية.",
				en: "We reinstall the server on the new build. Your worlds, settings and add-ons stay where they are, but take a backup first: a world opened on preview does not come back to release.",
			},
			fields: [
				{
					key: CHANNEL_VARIABLE,
					control: BridgeControl.Select,
					label: {
						ar: "القناة",
						en: "Channel",
					},
					help: {
						ar: "البريفيو يجرّب الجديد قبل الكل، ويحتاج كل اللاعبين يكونون على تطبيق Minecraft Preview.",
						en: "Preview tries what is coming next, and needs every player on the Minecraft Preview app.",
					},
					options: [
						{
							value: "release",
							label: {
								ar: "النسخة العادية",
								en: "Release",
							},
						},
						{
							value: "preview",
							label: {
								ar: "بريفيو",
								en: "Preview",
							},
						},
					],
				},
				{
					key: VERSION_VARIABLE,
					control: BridgeControl.Select,
					label: {
						ar: "رقم النسخة",
						en: "Build",
					},
					help: {
						ar: "خله على «أحدث نسخة» إلا إذا تبي تثبّت رقم معيّن.",
						en: "Leave it on Latest unless you want to pin a specific build.",
					},
					options: {
						module: "gameVersion",
					},
				},
			],
		},
	],
};

const settingsTab: Bridge.Tab = {
	id: "settings",
	title: {
		ar: "الإعدادات",
		en: "Settings",
	},
	icon: BridgeIcon.Settings,
	sections: [
		{
			layout: BridgeLayout.Form,
			id: "world",
			title: {
				ar: "الماب واللعب",
				en: "World and play",
			},
			help: {
				ar: "اسم السيرفر ووضع اللعب والصعوبة. أي تعديل هنا يبي إعادة تشغيل.",
				en: "Your server name, game mode and difficulty. Anything here needs a restart.",
			},
			target: BridgeFormTarget.Settings,
			module: "settings",
			restartHint: true,
			fields: [
				{
					key: PROPERTY_KEYS.serverName,
					control: BridgeControl.Text,
					label: {
						ar: "اسم السيرفر",
						en: "Server name",
					},
					maxLength: 64,
				},
				{
					key: PROPERTY_KEYS.levelSeed,
					control: BridgeControl.Text,
					label: {
						ar: "السييد",
						en: "Seed",
					},
					help: {
						ar: "يشتغل بس على ماب جديدة ما انبنت بعد.",
						en: "Only used for a world that does not exist yet.",
					},
					maxLength: 64,
				},
				{
					key: PROPERTY_KEYS.gamemode,
					control: BridgeControl.Select,
					label: {
						ar: "وضع اللعب",
						en: "Game mode",
					},
					options: GAME_MODES,
				},
				{
					key: PROPERTY_KEYS.forceGamemode,
					control: BridgeControl.Boolean,
					label: {
						ar: "افرض وضع اللعب",
						en: "Force game mode",
					},
				},
				{
					key: PROPERTY_KEYS.difficulty,
					control: BridgeControl.Select,
					label: {
						ar: "الصعوبة",
						en: "Difficulty",
					},
					options: DIFFICULTIES,
				},
				{
					key: PROPERTY_KEYS.allowCheats,
					control: BridgeControl.Boolean,
					label: {
						ar: "اسمح بالتشيتات",
						en: "Allow cheats",
					},
					warning: {
						ar: "يخلي أوامر اللعبة تشتغل داخل الماب، وهذا يغيّر طريقة اللعب.",
						en: "Turns game commands on inside the world, which changes how it plays.",
					},
				},
				{
					key: PROPERTY_KEYS.maxPlayers,
					control: BridgeControl.Number,
					label: {
						ar: "عدد اللاعبين",
						en: "Player slots",
					},
					min: 1,
					max: 100,
				},
				{
					key: PROPERTY_KEYS.defaultPlayerPermissionLevel,
					control: BridgeControl.Select,
					label: {
						ar: "صلاحية اللاعب الجديد",
						en: "Default permission",
					},
					options: PERMISSION_LEVELS,
				},
			],
		},
		{
			layout: BridgeLayout.Form,
			id: "access",
			title: {
				ar: "الدخول والشات",
				en: "Access and chat",
			},
			help: {
				ar: "مين يقدر يدخل، وكيف يتكلمون.",
				en: "Who can get in, and how they talk.",
			},
			target: BridgeFormTarget.Settings,
			module: "settings",
			restartHint: true,
			fields: [
				{
					key: PROPERTY_KEYS.onlineMode,
					control: BridgeControl.Boolean,
					label: {
						ar: "تحقق من حساب إكس بوكس",
						en: "Require an Xbox account",
					},
					warning: {
						ar: "لو قفلته، بيدروك ما يعطينا أرقام حسابات اللاعبين، وقائمة الأوبريتر بتوقف عن الشغل.",
						en: "Turning it off stops Bedrock giving us player account ids, and the operator list stops working.",
					},
				},
				{
					key: PROPERTY_KEYS.allowList,
					control: BridgeControl.Boolean,
					label: {
						ar: "القائمة البيضاء",
						en: "Allowlist",
					},
					help: {
						ar: "لما تشغّلها، ما يدخل إلا اللي في القائمة — وهذي طريقتك الوحيدة تمنع أحد.",
						en: "With it on, only players on the list can join — and it is your only way to keep someone out.",
					},
				},
				{
					key: PROPERTY_KEYS.enableLanVisibility,
					control: BridgeControl.Boolean,
					label: {
						ar: "يظهر في الشبكة المحلية",
						en: "Visible on the local network",
					},
				},
				{
					key: PROPERTY_KEYS.playerIdleTimeout,
					control: BridgeControl.Number,
					label: {
						ar: "طرد الواقف (بالدقائق)",
						en: "Kick idle players after (minutes)",
					},
					min: 0,
					max: 600,
				},
				{
					key: PROPERTY_KEYS.chatRestriction,
					control: BridgeControl.Select,
					label: {
						ar: "قيود الشات",
						en: "Chat restriction",
					},
					options: CHAT_RESTRICTIONS,
				},
				{
					key: PROPERTY_KEYS.disablePlayerInteraction,
					control: BridgeControl.Boolean,
					label: {
						ar: "امنع تفاعل اللاعبين",
						en: "Disable player interaction",
					},
				},
				{
					key: PROPERTY_KEYS.texturepackRequired,
					control: BridgeControl.Boolean,
					label: {
						ar: "الزم أدون المظهر",
						en: "Require the resource pack",
					},
					warning: {
						ar: "أي لاعب يرفض ينزّل الأدون بينطرد من السيرفر.",
						en: "Any player who declines the pack download gets disconnected.",
					},
				},
				{
					key: PROPERTY_KEYS.disableCustomSkins,
					control: BridgeControl.Boolean,
					label: {
						ar: "امنع السكنات المخصصة",
						en: "Disable custom skins",
					},
				},
			],
		},
		{
			layout: BridgeLayout.Form,
			id: "performance",
			title: {
				ar: "الأداء",
				en: "Performance",
			},
			help: {
				ar: "كل ما زدت المسافات، زاد الحمل على السيرفر.",
				en: "The further the server draws, the more work it does.",
			},
			target: BridgeFormTarget.Settings,
			module: "settings",
			restartHint: true,
			fields: [
				{
					key: PROPERTY_KEYS.viewDistance,
					control: BridgeControl.Slider,
					label: {
						ar: "مسافة الرؤية",
						en: "View distance",
					},
					min: 5,
					max: 96,
					step: 1,
				},
				{
					key: PROPERTY_KEYS.tickDistance,
					control: BridgeControl.Slider,
					label: {
						ar: "مسافة التفاعل",
						en: "Tick distance",
					},
					min: 4,
					max: 12,
					step: 1,
				},
				{
					key: PROPERTY_KEYS.maxThreads,
					control: BridgeControl.Number,
					label: {
						ar: "عدد الخيوط",
						en: "Threads",
					},
					min: 0,
					max: 16,
				},
				{
					key: PROPERTY_KEYS.clientSideChunkGeneration,
					control: BridgeControl.Boolean,
					label: {
						ar: "توليد التضاريس عند اللاعب",
						en: "Client-side chunk generation",
					},
				},
			],
		},
	],
};

const playersTab: Bridge.Tab = {
	id: "players",
	title: {
		ar: "اللاعبين",
		en: "Players",
	},
	icon: BridgeIcon.Users,
	sections: [
		{
			layout: BridgeLayout.Table,
			id: "online",
			title: {
				ar: "الحاضرين",
				en: "Online",
			},
			place: BridgePlace.Players,
			module: "players",
			columns: [
				{
					key: "name",
					label: {
						ar: "اللاعب",
						en: "Player",
					},
				},
				{
					key: "xuid",
					label: {
						ar: "رقم الحساب",
						en: "Account id",
					},
				},
			],
			empty: {
				ar: "ما فيه أحد داخل الحين.",
				en: "Nobody is online right now.",
			},
			actions: [
				{
					id: "kick",
					label: {
						ar: "اطرد",
						en: "Kick",
					},
					confirm: BridgeConfirm.Normal,
					fields: [
						REASON_FIELD,
					],
				},
				{
					id: "op",
					label: {
						ar: "خله أوبريتر",
						en: "Make operator",
					},
					confirm: BridgeConfirm.Strong,
					confirmText: {
						ar: "الأوبريتر يقدر يستخدم كل أوامر الإدارة داخل اللعبة، ويغيّر الماب كيف ما يبي.",
						en: "An operator can run every admin command in game and change the world however they like.",
					},
				},
				{
					id: "deop",
					label: {
						ar: "اسحب الأوبريتر",
						en: "Remove operator",
					},
					confirm: BridgeConfirm.Normal,
				},
				{
					id: "gamemode",
					label: {
						ar: "غيّر وضع اللعب",
						en: "Set game mode",
					},
					fields: [
						{
							key: "mode",
							control: BridgeControl.Select,
							label: {
								ar: "الوضع",
								en: "Mode",
							},
							options: GAME_MODES,
						},
					],
				},
				{
					id: "kill",
					label: {
						ar: "اقتله",
						en: "Kill",
					},
					confirm: BridgeConfirm.Normal,
					confirmText: {
						ar: "بيموت ويطيح كل اللي معه في مكانه.",
						en: "They die and drop everything they are carrying where they stand.",
					},
				},
			],
		},
		{
			layout: BridgeLayout.Table,
			id: "allowlist",
			title: {
				ar: "القائمة البيضاء",
				en: "Allowlist",
			},
			help: {
				ar: "لما تشغّل القائمة البيضاء من الإعدادات، ما يدخل سيرفرك إلا اللي هنا. في بيدروك ما فيه حظر، فهذي طريقتك.",
				en: "With the allowlist on in Settings, only the players here can join. Bedrock has no ban, so this is your way.",
			},
			place: BridgePlace.Players,
			module: "allowlist",
			columns: [
				{
					key: "name",
					label: {
						ar: "اللاعب",
						en: "Player",
					},
				},
				{
					key: "xuid",
					label: {
						ar: "رقم الحساب",
						en: "Account id",
					},
				},
				{
					key: "seen",
					label: {
						ar: "آخر دخول",
						en: "Last seen",
					},
				},
			],
			add: {
				label: {
					ar: "ضيف لاعب",
					en: "Add a player",
				},
				placeholder: "Gamertag",
			},
			empty: {
				ar: "القائمة فاضية. رقم الحساب يتعبّى لحاله أول ما يدخل اللاعب.",
				en: "The list is empty. The account id fills itself in the first time that player joins.",
			},
			actions: [
				{
					id: "remove",
					label: {
						ar: "شيله",
						en: "Remove",
					},
					confirm: BridgeConfirm.Normal,
					offline: true,
				},
			],
		},
		{
			layout: BridgeLayout.Table,
			id: "operators",
			title: {
				ar: "الأوبريتر",
				en: "Operators",
			},
			help: {
				ar: "بيدروك يحفظ الصلاحيات برقم الحساب، فاللاعب لازم يدخل مرة قبل تقدر تعطيه أوبريتر والسيرفر مطفي.",
				en: "Bedrock stores permissions by account id, so a player has to join once before you can op them while the server is off.",
			},
			place: BridgePlace.Players,
			module: "operators",
			columns: [
				{
					key: "name",
					label: {
						ar: "اللاعب",
						en: "Player",
					},
				},
				{
					key: "xuid",
					label: {
						ar: "رقم الحساب",
						en: "Account id",
					},
				},
				{
					key: "permission",
					label: {
						ar: "الصلاحية",
						en: "Permission",
					},
				},
			],
			add: {
				label: {
					ar: "ضيف أوبريتر",
					en: "Add an operator",
				},
				placeholder: "Gamertag",
			},
			empty: {
				ar: "ما فيه أوبريتر غيرك.",
				en: "Nobody else is an operator.",
			},
			actions: [
				{
					id: "setPermission",
					label: {
						ar: "غيّر الصلاحية",
						en: "Change permission",
					},
					offline: true,
					fields: [
						{
							key: "level",
							control: BridgeControl.Select,
							label: {
								ar: "الصلاحية",
								en: "Permission",
							},
							options: PERMISSION_LEVELS,
						},
					],
				},
				{
					id: "remove",
					label: {
						ar: "شيله",
						en: "Remove",
					},
					confirm: BridgeConfirm.Normal,
					offline: true,
				},
			],
		},
	],
};

const liveTab: Bridge.Tab = {
	id: "live",
	title: {
		ar: "التحكم",
		en: "Controls",
	},
	icon: BridgeIcon.Gamepad,
	sections: [
		{
			layout: BridgeLayout.Detail,
			id: "status",
			title: {
				ar: "حالة السيرفر",
				en: "Server status",
			},
			place: BridgePlace.Overview,
			module: "status",
		},
		{
			layout: BridgeLayout.Actions,
			id: "world",
			title: {
				ar: "الماب",
				en: "World",
			},
			help: {
				ar: "هذي تشتغل على طول على السيرفر الشغّال، وترجع لإعداداتك بعد إعادة التشغيل.",
				en: "These apply to the running server right away, and fall back to your settings after a restart.",
			},
			module: "gameplay",
			actions: [
				{
					id: "timeDay",
					label: {
						ar: "خلها نهار",
						en: "Set day",
					},
				},
				{
					id: "timeNight",
					label: {
						ar: "خلها ليل",
						en: "Set night",
					},
				},
				{
					id: "weatherClear",
					label: {
						ar: "صفّي الجو",
						en: "Clear weather",
					},
				},
				{
					id: "weatherRain",
					label: {
						ar: "نزّل مطر",
						en: "Rain",
					},
				},
				{
					id: "weatherThunder",
					label: {
						ar: "نزّل رعد",
						en: "Thunder",
					},
				},
				{
					id: "difficulty",
					label: {
						ar: "غيّر الصعوبة",
						en: "Set difficulty",
					},
					fields: [
						{
							key: "difficulty",
							control: BridgeControl.Select,
							label: {
								ar: "الصعوبة",
								en: "Difficulty",
							},
							options: DIFFICULTIES,
						},
					],
				},
				{
					id: "allowlistOn",
					label: {
						ar: "شغّل القائمة البيضاء",
						en: "Allowlist on",
					},
				},
				{
					id: "allowlistOff",
					label: {
						ar: "اقفل القائمة البيضاء",
						en: "Allowlist off",
					},
				},
				{
					id: "reloadPermissions",
					label: {
						ar: "أعد قراءة الصلاحيات",
						en: "Reload permissions",
					},
				},
			],
		},
		{
			layout: BridgeLayout.Actions,
			id: "broadcast",
			title: {
				ar: "رسالة للاعبين",
				en: "Message players",
			},
			help: {
				ar: "بيدروك ما فيه أمر say، فنستخدم tellraw.",
				en: "Bedrock has no say command, so we use tellraw.",
			},
			module: "broadcast",
			actions: [
				{
					id: "say",
					label: {
						ar: "أرسل رسالة",
						en: "Send a message",
					},
					fields: [
						MESSAGE_FIELD,
					],
				},
				{
					id: "title",
					label: {
						ar: "اعرض عنوان",
						en: "Show a title",
					},
					fields: [
						MESSAGE_FIELD,
					],
				},
			],
		},
	],
};

const worldsTab: Bridge.Tab = {
	id: "worlds",
	title: {
		ar: "المابات",
		en: "Worlds",
	},
	icon: BridgeIcon.Map,
	sections: [
		{
			layout: BridgeLayout.Table,
			id: "worlds",
			title: {
				ar: "المابات",
				en: "Worlds",
			},
			help: {
				ar: "على بيدروك النذر والإند والأوفرورلد كلهم في قاعدة بيانات وحدة، فما فيه طريقة نصفّر بُعد واحد لحاله.",
				en: "On Bedrock the Overworld, the Nether and the End all live in one database, so there is no way to reset a single dimension on its own.",
			},
			module: "worlds",
			restartHint: true,
			columns: [
				{
					key: "name",
					label: {
						ar: "الاسم",
						en: "Name",
					},
				},
				{
					key: "folder",
					label: {
						ar: "المجلد",
						en: "Folder",
					},
				},
				{
					key: "size",
					label: {
						ar: "الحجم",
						en: "Size",
					},
				},
				{
					key: "active",
					label: {
						ar: "مفعّلة",
						en: "Active",
					},
				},
			],
			upload: {
				label: {
					ar: "ارفع ماب",
					en: "Upload a world",
				},
				extensions: WORLD_EXTENSIONS,
				staging: WORLD_STAGING,
				mode: BridgeUploadMode.File,
			},
			empty: {
				ar: "ما فيه مابات مرفوعة.",
				en: "No worlds uploaded yet.",
			},
			actions: [
				{
					id: "activate",
					label: {
						ar: "فعّلها",
						en: "Activate",
					},
					confirm: BridgeConfirm.Normal,
					confirmText: {
						ar: "بنبدّل السيرفر لهذي الماب. لازم إعادة تشغيل عشان تشتغل.",
						en: "We switch the server to this world. It needs a restart to take effect.",
					},
				},
				{
					id: "delete",
					label: {
						ar: "احذفها",
						en: "Delete",
					},
					confirm: BridgeConfirm.Strong,
					confirmText: {
						ar: "حذف الماب يشيلها كاملة — الأوفرورلد والنذر والإند وكل شيء بنيتوه — للأبد. النسخة الاحتياطية هي طريقك الوحيد للرجوع، فخذ لك وحدة قبل لا تكمّل.",
						en: "Deleting a world removes all of it — Overworld, Nether, End, everything you built — forever. A backup is your only way back, so take one before you continue.",
					},
				},
			],
		},
	],
};

const addonsTab: Bridge.Tab = {
	id: "addons",
	title: {
		ar: "الأدونات",
		en: "Add-ons",
	},
	icon: BridgeIcon.Puzzle,
	sections: [
		{
			layout: BridgeLayout.Table,
			id: "packs",
			title: {
				ar: "الأدونات المركّبة",
				en: "Installed add-ons",
			},
			help: {
				ar: "نركّبها ونفعّلها على مابك على طول، بس اللعبة ما تقراها إلا بعد إعادة التشغيل. الترتيب يقرر مين يطلع فوق لو أدونين غيّروا نفس الشي.",
				en: "We install and activate them on your world right away, but the game only reads them after a restart. Order decides which one wins when two change the same thing.",
			},
			module: "packs",
			restartHint: true,
			columns: [
				{
					key: "name",
					label: {
						ar: "الأدون",
						en: "Add-on",
					},
				},
				{
					key: "kind",
					label: {
						ar: "النوع",
						en: "Kind",
					},
				},
				{
					key: "version",
					label: {
						ar: "النسخة",
						en: "Version",
					},
				},
				{
					key: "enabled",
					label: {
						ar: "مفعّل",
						en: "Enabled",
					},
				},
				{
					key: "order",
					label: {
						ar: "الترتيب",
						en: "Order",
					},
				},
			],
			upload: {
				label: {
					ar: "ارفع أدون",
					en: "Upload an add-on",
				},
				extensions: PACK_EXTENSIONS,
				staging: PACK_STAGING,
				mode: BridgeUploadMode.File,
			},
			empty: {
				ar: "ما فيه أدونات مركّبة. ارفع ملف mcaddon أو mcpack وبنركّبه لك.",
				en: "No add-ons installed. Upload a .mcaddon or .mcpack and we install it for you.",
			},
			actions: [
				{
					id: "enable",
					label: {
						ar: "فعّله",
						en: "Enable",
					},
				},
				{
					id: "disable",
					label: {
						ar: "عطّله",
						en: "Disable",
					},
				},
				{
					id: "moveUp",
					label: {
						ar: "حركه فوق",
						en: "Move up",
					},
				},
				{
					id: "moveDown",
					label: {
						ar: "حركه تحت",
						en: "Move down",
					},
				},
				{
					id: "remove",
					label: {
						ar: "احذفه",
						en: "Remove",
					},
					confirm: BridgeConfirm.Strong,
					confirmText: {
						ar: "لو شلت أدون سلوك وماب شغّالة عليه، كل شي جابه الأدون بيختفي من الماب — الوحوش والأشياء اللي أضافها. خذ نسخة احتياطية قبل.",
						en: "If you remove a behavior pack a world was using, everything it added disappears from that world — the mobs and items it brought. Take a backup first.",
					},
				},
			],
		},
	],
};

export const panel: Bridge.Panel = {
	tabs: [
		versionTab,
		settingsTab,
		playersTab,
		liveTab,
		worldsTab,
		addonsTab,
	],
};
