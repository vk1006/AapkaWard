export * from "./platform";
export * from "./identity";
export * from "./content";
export * from "./suggestions";
export * from "./events";
export * from "./issues";
export * from "./petitions";
export * from "./admin-comments";

import * as platform from "./platform";
import * as identity from "./identity";
import * as content from "./content";
import * as suggestions from "./suggestions";
import * as events from "./events";
import * as issues from "./issues";
import * as petitions from "./petitions";
import * as adminComments from "./admin-comments";

export const schema = {
  ...platform,
  ...identity,
  ...content,
  ...suggestions,
  ...events,
  ...issues,
  ...petitions,
  ...adminComments,
};
