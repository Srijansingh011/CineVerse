import { Router } from 'express';
import { SocialController } from './social.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router: Router = Router();

// Feed & Watchlist
router.get('/feed', authenticate, SocialController.getActivityFeed);
router.post('/watchlist/toggle', authenticate, SocialController.toggleWatchlist);
router.get('/watchlist', authenticate, SocialController.getWatchlist);

// Diary
router.post('/diary', authenticate, SocialController.addDiaryEntry);
router.get('/diary', authenticate, SocialController.getDiary);

// Follow / Unfollow
router.post('/follow/:id', authenticate, SocialController.followUser);
router.post('/unfollow/:id', authenticate, SocialController.unfollowUser);
router.get('/followers/:id', SocialController.getFollowers);
router.get('/following/:id', SocialController.getFollowing);

// Reviews & Comments
router.post('/reviews', authenticate, SocialController.createOrUpdateReview);
router.delete('/reviews/:id', authenticate, SocialController.deleteReview);
router.post('/reviews/:id/like', authenticate, SocialController.likeReview);
router.post('/reviews/:id/unlike', authenticate, SocialController.unlikeReview);
router.post('/reviews/:id/comments', authenticate, SocialController.addComment);

// Custom User Lists
router.post('/lists', authenticate, SocialController.createList);
router.get('/lists/:id', SocialController.getListDetails);
router.post('/lists/:id/movies', authenticate, SocialController.addMovieToList);
router.delete('/lists/:id/movies/:movieId', authenticate, SocialController.removeMovieFromList);
router.post('/lists/:id/reorder', authenticate, SocialController.reorderList);

// Taste Compatibility & Analytics
router.get('/taste/match/:targetUserId', authenticate, SocialController.calculateSimilarity);
router.get('/taste/profile/:id', SocialController.getUserAnalytics);

// Movie Night Planner
router.post('/planner', authenticate, SocialController.planMovieNight);

export default router;
