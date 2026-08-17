import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware.js';
import { WatchPartyService } from './watchparty.service.js';

export class WatchPartyController {
  // ==========================================
  // WATCH PARTIES
  // ==========================================

  public static async createParty(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const hostId = req.user!.id;
      const { name } = req.body;

      if (!hostId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!name) {
        res.status(400).json({ status: 'error', message: 'Party name is required' });
        return;
      }

      const party = await WatchPartyService.createParty(hostId, name);
      res.status(201).json({ status: 'success', data: party });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async inviteUser(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: partyId } = req.params;
      const { email } = req.body;

      if (!email) {
        res.status(400).json({ status: 'error', message: 'Email address is required' });
        return;
      }

      const membership = await WatchPartyService.inviteUser(partyId, email);
      res.json({ status: 'success', data: membership });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async leaveParty(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: partyId } = req.params;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      await WatchPartyService.leaveParty(partyId, userId);
      res.json({ status: 'success', message: 'Successfully left the watch party' });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async suggestMovie(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { id: partyId } = req.params;
      const { movieId } = req.body;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!movieId) {
        res.status(400).json({ status: 'error', message: 'movieId is required' });
        return;
      }

      const vote = await WatchPartyService.suggestMovie(partyId, userId, movieId);
      res.status(201).json({ status: 'success', data: vote });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async getVotes(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id: partyId } = req.params;
      const voteData = await WatchPartyService.getVotes(partyId);
      res.json({ status: 'success', data: voteData });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async selectMovieShow(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const hostId = req.user!.id;
      const { id: partyId } = req.params;
      const { showId } = req.body;

      if (!hostId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!showId) {
        res.status(400).json({ status: 'error', message: 'showId is required' });
        return;
      }

      const party = await WatchPartyService.selectMovieShow(partyId, hostId, showId);
      res.json({ status: 'success', data: party });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async getPartyDetails(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const party = await WatchPartyService.getPartyDetails(id as string);
      if (!party) {
        res.status(404).json({ status: 'error', message: 'Watch Party not found' });
        return;
      }

      res.json({ status: 'success', data: party });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  // ==========================================
  // ADJACENT SEATS
  // ==========================================

  public static async findAdjacentSeats(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { showId, seatCount } = req.query;

      if (!showId || !seatCount) {
        res.status(400).json({ status: 'error', message: 'showId and seatCount query parameters are required' });
        return;
      }

      const seats = await WatchPartyService.findAdjacentSeats(
        showId as string,
        parseInt(seatCount as string)
      );

      res.json({ status: 'success', data: seats });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  // ==========================================
  // SPLIT PAYMENTS
  // ==========================================

  public static async createSplitPaymentBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { partyId, showId, seatIds, shares } = req.body;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!showId || !seatIds || !shares || !Array.isArray(seatIds) || !Array.isArray(shares)) {
        res.status(400).json({ status: 'error', message: 'showId, seatIds array, and shares array are required' });
        return;
      }

      const booking = await WatchPartyService.createSplitPaymentBooking(
        userId,
        partyId || null,
        showId,
        seatIds,
        shares
      );

      res.status(201).json({ status: 'success', data: booking });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async paySplitShare(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { splitPaymentId } = req.params;
      const { paymentId } = req.body;

      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      if (!paymentId) {
        res.status(400).json({ status: 'error', message: 'paymentId is required' });
        return;
      }

      const split = await WatchPartyService.paySplitShare(userId, splitPaymentId, paymentId);
      res.json({ status: 'success', data: split });
    } catch (error: any) {
      res.status(400).json({ status: 'error', message: error.message });
    }
  }

  public static async releaseExpiredSplits(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const count = await WatchPartyService.releaseExpiredSplits();
      res.json({ status: 'success', message: `Released ${count} expired split bookings` });
    } catch (error: any) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
}
