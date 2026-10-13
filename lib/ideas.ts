export const IDEA_STATUSES=['new','reviewing','done'] as const;
export type IdeaStatus=typeof IDEA_STATUSES[number];
export type Idea={id:string;title:string;body:string;status:IdeaStatus;created_at:string;author_name?:string|null};
export function ideaStatus(status:IdeaStatus){return status==='new'?'New idea':status==='reviewing'?'Reviewing':'Done';}
export function validIdea(title:string,body:string){return title.trim().length>=3&&title.trim().length<=100&&body.trim().length>=10&&body.trim().length<=2000;}
export function ideaError(error:unknown){
  const value=error as {code?:string;message?:string};
  if(value?.message==='idea_limit')return 'You can send up to five ideas in 24 hours.';
  if(value?.message?.includes('verified_'))return 'Account verification is required.';
  if(value?.code==='PGRST202'||value?.code==='42P01')return 'Database update required.';
  return 'Could not load data.';
}
