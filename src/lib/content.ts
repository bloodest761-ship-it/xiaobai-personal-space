import { categories, entries, projects } from "@/data/mock-content";
import type { ContentType, Entry, Project } from "@/types/content";

export function getCategory(type: ContentType) {
  return categories.find((category) => category.type === type);
}

export function isContentType(value: string): value is ContentType {
  return categories.some((category) => category.type === value);
}

export function getEntriesByType(type: ContentType) {
  return type === "project"
    ? []
    : entries
        .filter((entry) => entry.type === type)
        .sort(sortByPublishedDateDesc);
}

export function getProjects() {
  return [...projects].sort(sortByUpdatedDateDesc);
}

export function getFeaturedEntries() {
  return entries.filter((entry) => entry.featured).sort(sortByPublishedDateDesc);
}

export function getFeaturedProjects() {
  return projects.filter((project) => project.featured).sort(sortByUpdatedDateDesc);
}

export function getLatestUpdates() {
  return [...entries, ...projects].sort((left, right) => {
    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

export function getEntryBySlug(slug: string) {
  return entries.find((entry) => entry.slug === slug);
}

export function getProjectBySlug(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function getEntryNavigation(entry: Entry) {
  const sortedEntries = [...entries].sort(sortByPublishedDateDesc);
  const currentIndex = sortedEntries.findIndex((item) => item.slug === entry.slug);

  return {
    previous: sortedEntries[currentIndex + 1],
    next: sortedEntries[currentIndex - 1],
  };
}

export function getCategoryStats(type: ContentType) {
  const items = type === "project" ? projects : entries.filter((entry) => entry.type === type);
  const latest = [...items].sort(sortByUpdatedDateDesc)[0];

  return {
    count: items.length,
    latestTitle: latest ? getContentTitle(latest) : "暂无内容",
    updatedAt: latest?.updatedAt,
  };
}

export function getContentTitle(content: Entry | Project) {
  return content.type === "project" ? content.name : content.title;
}

function sortByPublishedDateDesc(left: Entry, right: Entry) {
  return new Date(right.publishedAt).getTime() - new Date(left.publishedAt).getTime();
}

function sortByUpdatedDateDesc(left: Entry | Project, right: Entry | Project) {
  return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
}
