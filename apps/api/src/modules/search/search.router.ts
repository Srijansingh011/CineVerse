import { Router } from 'express';
import { searchController } from './search.controller.js';

const router: Router = Router();
router.get('/', searchController.search.bind(searchController));

export default router;
