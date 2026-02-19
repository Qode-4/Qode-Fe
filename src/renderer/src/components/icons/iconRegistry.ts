import Add_round_light from './raw/Add_round_light.svg?react';
import Code_light from './raw/Code_light.svg?react';
import Copy_light from './raw/Copy_light.svg?react';
import File_dock_light from './raw/File_dock_light.svg?react';
import Group_light from './raw/Group_light.svg?react';
import Refresh_light from './raw/Refresh_light.svg?react';
import Send_hor_fill from './raw/Send_hor_fill.svg?react';
import Setting_line_light from './raw/Setting_line_light.svg?react';
import User_light from './raw/User_light.svg?react';
import dot_round_fill from './raw/dot_round_fill.svg?react';

export const ICON_REGISTRY = {
  Add_round_light,
  Code_light,
  Copy_light,
  File_dock_light,
  Group_light,
  Refresh_light,
  Send_hor_fill,
  Setting_line_light,
  User_light,
  dot_round_fill
} as const;

export const ICON_NAMES = Object.keys(ICON_REGISTRY) as Array<keyof typeof ICON_REGISTRY>;
