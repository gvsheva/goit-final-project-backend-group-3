import {
  Router,
  type NextFunction,
  type Request,
  type Response,
} from "express";

var router = Router();

/**
 * @openapi
 * /:
 *  get:
 *      description: Get the home page
 *      responses:
 *          200:
 *              description: Successful response
 */
router.get("/", function (req: Request, res: Response, next: NextFunction) {
  res.json("hello, world!");
});
export default router;
