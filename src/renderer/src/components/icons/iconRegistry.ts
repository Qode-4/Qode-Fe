import Add_round_light from './raw/Add_round_light.svg?react';
import Code_light from './raw/Code_light.svg?react';
import Copy_light from './raw/Copy_light.svg?react';
import File_dock_light from './raw/File_dock_light.svg?react';
import Folder_light from './raw/Folder_light.svg?react';
import Group_light from './raw/Group_light.svg?react';
import More_horizontal_light from './raw/More_horizontal_light.svg?react';
import Pencil_light from './raw/Pencil_light.svg?react';
import Refresh_light from './raw/Refresh_light.svg?react';
import Send_hor_fill from './raw/Send_hor_fill.svg?react';
import Setting_line_light from './raw/Setting_line_light.svg?react';
import Trash_light from './raw/Trash_light.svg?react';
import User_light from './raw/User_light.svg?react';
import dot_round_fill from './raw/dot_round_fill.svg?react';
import create_box from './raw/plus-box.svg?react';
import shared from './raw/shared-icon.svg?react';

export const ICON_REGISTRY = {
  Add_round_light,
  Code_light,
  Copy_light,
  File_dock_light,
  Folder_light,
  Group_light,
  More_horizontal_light,
  Pencil_light,
  Refresh_light,
  Send_hor_fill,
  Setting_line_light,
  Trash_light,
  User_light,
  dot_round_fill,
  create_box,
  shared
} as const;

export const ICON_NAMES = Object.keys(ICON_REGISTRY) as Array<keyof typeof ICON_REGISTRY>;
