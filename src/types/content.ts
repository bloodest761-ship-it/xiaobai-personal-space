export type ContentType = "reflection" | "essay" | "project" | "understanding";

export type ProjectStatus =
  | "idea"
  | "in_progress"
  | "iterating"
  | "completed"
  | "paused";

export type ContentCategory = {
  type: ContentType;
  name: string;
  description: string;
  href: string;
};

export type CoverImage = {
  src: string;
  alt: string;
};

export type Entry = {
  slug: string;
  type: Exclude<ContentType, "project">;
  title: string;
  summary: string;
  publishedAt: string;
  updatedAt: string;
  tags: string[];
  featured: boolean;
  cover?: CoverImage;
  body: string[];
};

export type Project = {
  slug: string;
  type: "project";
  name: string;
  title: string;
  summary: string;
  status: ProjectStatus;
  startedAt: string;
  updatedAt: string;
  techStack: string[];
  featured: boolean;
  cover: CoverImage;
  gallery: CoverImage[];
  sections: {
    background: string[];
    goals: string[];
    process: string[];
    problems: string[];
    adjustments: string[];
    result: string[];
    learnings: string[];
    nextSteps: string[];
  };
};

export type AnyContent = Entry | Project;
