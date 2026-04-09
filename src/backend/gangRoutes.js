const express = require('express');
const router = express.Router();
const authMiddleware = require('./authMiddleware');
const { generateRandomMember, calculateExpNeeded } = require('./gangUtils');

// GET /gang/my
router.get('/my', authMiddleware, async (req, res) => {
  const gang = await db.collection('gangs').findOne({ leaderId: req.userId });
  if (!gang) return res.status(404).json({ error: 'Você não tem uma quadrilha' });
  res.json({ gang });
});

// POST /gang/recruit
router.post('/recruit', authMiddleware, async (req, res) => {
  const { method } = req.body;
  const user = await db.collection('users').findOne({ _id: req.userId });
  const gang = await db.collection('gangs').findOne({ leaderId: req.userId });
  if (!gang) return res.status(400).json({ error: 'Sem quadrilha' });

  let member;
  if (method === 'mission') {
    if (user.balances.dirtyMoney < 5000) return res.status(400).json({ error: 'Dinheiro sujo insuficiente' });
    await db.collection('users').updateOne({ _id: req.userId }, { $inc: { 'balances.dirtyMoney': -5000 } });
    member = generateRandomMember({ rarities: [0.6, 0.25, 0.1, 0.04, 0.01] });
    // schedule job to add member after 1h (use bull or setTimeout)
  } else if (method === 'market') {
    if (user.balances.cleanMoney < 50000) return res.status(400).json({ error: 'Dinheiro limpo insuficiente' });
    await db.collection('users').updateOne({ _id: req.userId }, { $inc: { 'balances.cleanMoney': -50000 } });
    member = generateRandomMember({ rarities: [0.4, 0.35, 0.15, 0.08, 0.02] });
  } else if (method === 'premium') {
    // verificar moeda premium (ex: coins)
    member = generateRandomMember({ rarities: [0, 0, 0.9, 0.1, 0] });
  } else {
    return res.status(400).json({ error: 'Método inválido' });
  }

  member.id = require('crypto').randomUUID();
  await db.collection('gangs').updateOne({ _id: gang._id }, { $push: { members: member } });
  res.json({ member });
});

// POST /gang/train
router.post('/train', authMiddleware, async (req, res) => {
  const { memberId, usePremium } = req.body;
  const gang = await db.collection('gangs').findOne({ leaderId: req.userId });
  const memberIndex = gang.members.findIndex(m => m.id === memberId);
  if (memberIndex === -1) return res.status(404).json({ error: 'Membro não encontrado' });
  let member = gang.members[memberIndex];
  let expGain = 100;
  if (usePremium) expGain = 500;
  member.exp += expGain;
  while (member.exp >= member.expToNext && member.level < 100) {
    member.exp -= member.expToNext;
    member.level++;
    member.expToNext = calculateExpNeeded(member.level);
  }
  await db.collection('gangs').updateOne({ _id: gang._id, 'members.id': memberId }, { $set: { 'members.$': member } });
  res.json({ member });
});

// Outras rotas: equip, toggle-active, dismiss, donate, upgrade-skill seguem o mesmo padrão.