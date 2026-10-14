// Type declarations for @alsania/alsania-tools
declare module '@alsania/alsania-tools' {
  const agent: Record<string, (...args: any[]) => any>;
  const memory: Record<string, (...args: any[]) => any>;
  const system: Record<string, (...args: any[]) => any>;
  const web: Record<string, (...args: any[]) => any>;
  const mobile: Record<string, (...args: any[]) => any>;
  const data: Record<string, (...args: any[]) => any>;
  const ai: Record<string, (...args: any[]) => any>;
  const code: Record<string, (...args: any[]) => any>;
  const media: Record<string, (...args: any[]) => any>;
  const cloud: Record<string, (...args: any[]) => any>;
  const comm: Record<string, (...args: any[]) => any>;
  const skills: Record<string, (...args: any[]) => any>;
  const utils: Record<string, (...args: any[]) => any>;
  export default {
    agent, memory, system, web, mobile, data, ai, code, media, cloud, comm, skills, utils
  };
}