import type { MouseEventHandler, ReactNode, RefObject } from 'react';
import type { ProjectsListData } from '../../api/generated/data-contracts';
import type { IconName } from '../icons/iconTypes';
import { Logo } from './Logo';
import { ProjectSwitcher } from './ProjectSwitcher';

type Props = {
  className?: string;
  logo?: ReactNode;
  projects?: ProjectsListData['data'];
  selectedProjectId?: string;
  onOpenCreateProject?: () => void;
  openMenuProjectId?: string | null;
  menuTriggerRef?: RefObject<HTMLButtonElement | null>;
  onOpenProjectMenu?: (projectId: string, button: HTMLButtonElement) => void;
  settingsIconName?: IconName;
  settingsAriaLabel?: string;
  onSettingsClick?: MouseEventHandler<HTMLButtonElement>;
};

export const DrawerHeader = ({
  className,
  logo,
  projects = [],
  selectedProjectId,
  onOpenCreateProject,
  openMenuProjectId,
  menuTriggerRef,
  onOpenProjectMenu
}: Props): React.JSX.Element => {
  return (
    <header
      className={['inline-flex h-10 w-[220px] items-center gap-2 px-4', className ?? ''].join(' ')}
    >
      <span className="shrink-0">{logo ?? <Logo ariaLabel="Qode" />}</span>
      <ProjectSwitcher
        className="flex-1"
        projects={projects}
        selectedProjectId={selectedProjectId}
        onOpenCreateProject={onOpenCreateProject}
        openMenuProjectId={openMenuProjectId}
        menuTriggerRef={menuTriggerRef}
        onOpenProjectMenu={onOpenProjectMenu}
      />
    </header>
  );
};
