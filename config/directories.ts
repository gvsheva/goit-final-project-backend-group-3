import { join } from "path";
import { getenv } from "./utils.ts";

export const DATA_DIRECTORY = getenv("DATA_DIRECTORY", "./data");
export const TMP_DIRECTORY = join(DATA_DIRECTORY, "tmp");
export const PUBLIC_DIRECTORY = join(DATA_DIRECTORY, "public");
export const AVATAR_DIRECTORY = join(PUBLIC_DIRECTORY, "avatar");
