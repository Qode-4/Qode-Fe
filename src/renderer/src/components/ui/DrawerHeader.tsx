import type { MouseEventHandler, ReactNode } from 'react';
import type { ProjectsListData } from '../../api/generated/data-contracts';
import type { IconName } from '../icons/iconTypes';
import { IconButton } from './IconButton';
import { Logo } from './Logo';
import { ProjectSwitcher } from './ProjectSwitcher';

type Props = {
  className?: string;
  logo?: ReactNode;
  projects?: ProjectsListData['data'];
  selectedProjectId?: string;
  onOpenCreateProject?: () => void;
  projectsError?: boolean;
  projectsFetching?: boolean;
  onRetryProjects?: () => void;
  settingsIconName?: IconName;
  settingsAriaLabel?: string;
  settingsDisabled?: boolean;
  onSettingsClick?: MouseEventHandler<HTMLButtonElement>;
};

export const DrawerHeader = ({
  className,
  logo,
  projects = [],
  selectedProjectId,
  onOpenCreateProject,
  projectsError = false,
  projectsFetching = false,
  onRetryProjects,
  settingsIconName = 'Setting_line_light',
  settingsAriaLabel = '프로젝트 설정',
  settingsDisabled = false,
  onSettingsClick
}: Props): React.JSX.Element => {
  return (
    <header
      className={['inline-flex h-10 w-[220px] items-center gap-2 pl-4 pr-0', className ?? ''].join(
        ' '
      )}
    >
      <span className="shrink-0">{logo ?? <Logo ariaLabel="Qode" />}</span>
      <ProjectSwitcher
        className="flex-1"
        projects={projects}
        selectedProjectId={selectedProjectId}
        onOpenCreateProject={onOpenCreateProject}
        isError={projectsError}
        isFetching={projectsFetching}
        onRetry={onRetryProjects}
      />
      <IconButton
        size="md"
        name={settingsIconName}
        aria-label={settingsAriaLabel}
        disabled={settingsDisabled}
        onClick={onSettingsClick}
      />
    </header>
  );
};
