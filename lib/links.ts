import type { AgendaItem } from "./types";

export function agendaHref(item: AgendaItem) {
  switch (item.source) {
    case "event":
      return `/events?id=${item.sourceId}`;
    case "task":
      return `/tasks?edit=${item.sourceId}`;
    case "trip":
      return `/shopping?trip=${item.sourceId}`;
    case "entry":
      return `/calendar?edit=${item.sourceId}`;
    case "payment":
      return `/budget?edit=${item.sourceId}`;
    case "fitting":
    case "clothing":
      return `/family?clothing=${item.sourceId}`;
    case "purchase":
      return `/shopping?edit=${item.sourceId}`;
  }
}
