import express from 'express';
import jwt from 'jsonwebtoken';
import { sql } from '../server.js';

const router = express.Router();
const JWT_SECRET = 'your-super-secret-key-change-this';

const authenticateUser = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: 'Invalid token' });
    }
};

// Get all launchpad projects
router.get('/projects', async (req, res) => {
    try {
        const projects = await sql`
            SELECT * FROM launchpad_projects 
            ORDER BY created_at DESC
        `;
        res.json(projects);
    } catch (err) {
        console.error('Launchpad error:', err);
        // Mock data
        res.json([
            {
                id: 1,
                name: 'zkSync Era',
                symbol: 'ZK',
                description: 'Layer 2 scaling solution for Ethereum with zero-knowledge proofs',
                price: 0.45,
                fdv: 45000000,
                raised: 4200000,
                softCap: 5000000,
                hardCap: 10000000,
                startDate: new Date(Date.now() - 86400000),
                endDate: new Date(Date.now() + 86400000 * 3),
                status: 'live',
                logo: 'ZK',
                chain: 'Ethereum',
                participants: 1234
            },
            {
                id: 2,
                name: 'Arbitrum Nova',
                symbol: 'ARB',
                description: 'Optimistic rollup for gaming and social applications',
                price: 0.32,
                fdv: 32000000,
                raised: 2800000,
                softCap: 4000000,
                hardCap: 8000000,
                startDate: new Date(Date.now() - 86400000),
                endDate: new Date(Date.now() + 86400000 * 2),
                status: 'live',
                logo: 'ARB',
                chain: 'Arbitrum',
                participants: 2345
            },
            {
                id: 3,
                name: 'StarkNet',
                symbol: 'STRK',
                description: 'Validity rollup using STARK proofs for maximum scalability',
                price: 0.78,
                fdv: 78000000,
                raised: 6100000,
                softCap: 6000000,
                hardCap: 12000000,
                startDate: new Date(Date.now() + 86400000 * 2),
                endDate: new Date(Date.now() + 86400000 * 5),
                status: 'upcoming',
                logo: 'STRK',
                chain: 'StarkNet',
                participants: 3456
            }
        ]);
    }
});

// Get single project
router.get('/project/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [project] = await sql`
            SELECT * FROM launchpad_projects WHERE id = ${id}
        `;
        res.json(project);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Participate in launchpad
router.post('/participate', authenticateUser, async (req, res) => {
    const { projectId, amount } = req.body;
    const userId = req.user.id;
    
    try {
        const [project] = await sql`
            SELECT * FROM launchpad_projects WHERE id = ${projectId}
        `;
        
        if (!project) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        if (project.status !== 'live') {
            return res.status(400).json({ error: 'Project not live' });
        }
        
        // Check if already participated
        const existing = await sql`
            SELECT id FROM launchpad_participants 
            WHERE user_id = ${userId} AND project_id = ${projectId}
        `;
        
        if (existing.length > 0) {
            return res.status(400).json({ error: 'Already participated' });
        }
        
        // Create participation
        await sql`
            INSERT INTO launchpad_participants (user_id, project_id, amount, status)
            VALUES (${userId}, ${projectId}, ${amount}, 'confirmed')
        `;
        
        // Update project raised amount
        await sql`
            UPDATE launchpad_projects 
            SET raised = raised + ${amount}
            WHERE id = ${projectId}
        `;
        
        res.json({ success: true, message: 'Participation confirmed' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get user's participations
router.get('/my-participations', authenticateUser, async (req, res) => {
    const userId = req.user.id;
    
    try {
        const participations = await sql`
            SELECT 
                p.*,
                lp.name,
                lp.symbol,
                lp.logo
            FROM launchpad_participants p
            JOIN launchpad_projects lp ON p.project_id = lp.id
            WHERE p.user_id = ${userId}
            ORDER BY p.created_at DESC
        `;
        res.json(participations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
