export type FolderItem = {
  id: string;
  sectionId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type SectionItem = {
  id: string;
  projectId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  folders: FolderItem[];
};

export type ProjectSectionsResponse = {
  ok: true;
  data: SectionItem[];
};

export type PatchSectionBody = {
  name: string;
};

export type PostSectionBody = {
  name: string;
};

export type PostFolderBody = {
  name: string;
};
