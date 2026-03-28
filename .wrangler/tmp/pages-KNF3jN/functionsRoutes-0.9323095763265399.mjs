import { onRequestPost as __api_evaluate_ts_onRequestPost } from "C:\\Users\\Destiny\\Desktop\\pog-vibe-interactive\\New folder\\Bathospire-Professor-\\functions\\api\\evaluate.ts"
import { onRequestGet as __api_profile_ts_onRequestGet } from "C:\\Users\\Destiny\\Desktop\\pog-vibe-interactive\\New folder\\Bathospire-Professor-\\functions\\api\\profile.ts"
import { onRequestPost as __api_profile_ts_onRequestPost } from "C:\\Users\\Destiny\\Desktop\\pog-vibe-interactive\\New folder\\Bathospire-Professor-\\functions\\api\\profile.ts"

export const routes = [
    {
      routePath: "/api/evaluate",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_evaluate_ts_onRequestPost],
    },
  {
      routePath: "/api/profile",
      mountPath: "/api",
      method: "GET",
      middlewares: [],
      modules: [__api_profile_ts_onRequestGet],
    },
  {
      routePath: "/api/profile",
      mountPath: "/api",
      method: "POST",
      middlewares: [],
      modules: [__api_profile_ts_onRequestPost],
    },
  ]