/**
 * COMMANDIA — gangApi.ts
 * Service de API para operações da gangue
 */

import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

interface GangData {
  members: any[];
  formation: string;
  ct: any;
  hospital: any;
}

interface TrainingJob {
  memberId: string;
  memberType: string;
  fromLevel: number;
  toLevel: number;
  costDirtyMoney: number;
  endsAt: string;
}

class GangApi {
  async getGang(): Promise<GangData> {
    const response = await axios.get(`${API_BASE}/player/gang`);
    return response.data;
  }

  async getMembers() {
    const response = await axios.get(`${API_BASE}/player/gang/members`);
    return response.data;
  }

  async getMemberById(memberId: string) {
    const response = await axios.get(`${API_BASE}/player/gang/members/${memberId}`);
    return response.data;
  }

  async addMember(memberData: { type: string; level: number }) {
    const response = await axios.post(`${API_BASE}/player/gang/recruit`, memberData);
    return response.data;
  }

  async trainMember(memberId: string, targetLevel: number) {
    const response = await axios.post(`${API_BASE}/player/gang/train`, {
      memberId,
      targetLevel,
    });
    return response.data;
  }

  async setFormation(formationType: string) {
    const response = await axios.put(`${API_BASE}/player/gang/formation`, {
      formation: formationType,
    });
    return response.data;
  }

  async getFormation() {
    const response = await axios.get(`${API_BASE}/player/gang/formation`);
    return response.data;
  }

  async completeTraining(trainingJobId: string) {
    const response = await axios.post(`${API_BASE}/player/gang/complete-training`, {
      trainingJobId,
    });
    return response.data;
  }

  async getTrainingJobs(): Promise<TrainingJob[]> {
    const response = await axios.get(`${API_BASE}/player/gang/training-jobs`);
    return response.data;
  }

  async removeMember(memberId: string) {
    const response = await axios.delete(`${API_BASE}/player/gang/members/${memberId}`);
    return response.data;
  }
}

export default new GangApi();
