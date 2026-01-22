// -------------------------------------------------------
// -----------      AST Type Definitions      ------------   
//---    Defines the structure of our Language's AST   ---
//--------------------------------------------------------

export interface ASTNode {
  type: string;
} 

export type Statement =
  | StoryDeclaration
  | StartDeclaration
  | SceneDeclaration
  | CharacterInstantiation
  | VariableDeclaration
  | DbDeclaration
  | Assignment
  | ConditionalStatement
  | DoWhileStatement
  | ChooseStatement
  | CharacterDeclaration
  | TransitionStatement
  | LogStatement
  | SaysStatement
  | ThruStatement
  | EndScene
  | EndStory
  | PerceivesBlock;

// 1. Root Declarations
export interface StoryDeclaration extends ASTNode {
  type: 'StoryDeclaration';
  name: string;
}

export interface StartDeclaration extends ASTNode {
  type: 'StartDeclaration';
  scene: string;
}

export interface SceneDeclaration extends ASTNode {
  type: 'SceneDeclaration';
  name: string;
  body: Statement[];
}

// 2. Statements
export interface CharacterInstantiation extends ASTNode {
  type: 'CharacterInstantiation';
  characterType: string;  // e.g., "Player"
  instanceName: string;   // e.g., "hero"
}

export interface VariableDeclaration extends ASTNode {
  type: 'VariableDeclaration';
  dataType: string; // e.g., "text", "number"
  name: string;
}

export interface DbDeclaration extends ASTNode {
  type: 'DbDeclaration';
  name: string;
  connectionString: string;
}

// It allows the target to be a simple name ("x") or a member access ("traveler.name")
export interface Assignment extends ASTNode {
  type: 'Assignment';
  target: string | MemberAccess; 
  value: Expression;
}

export interface ConditionalStatement extends ASTNode {
  type: 'ConditionalStatement';
  condition: Expression;
  body: Statement[];
}

export interface DoWhileStatement extends ASTNode {
  type: 'DoWhileStatement';
  body: Statement[];
  condition: Expression;
}

export interface ChooseStatement extends ASTNode {
  type: 'ChooseStatement';
  variable: string;
  cases: ChooseCase[]; 
  defaultCase?: DefaultCase;
}

export interface ChooseCase {
  type: 'ChooseCase';
  value: string;
  target: string;
}

export interface DefaultCase {
  type: 'DefaultCase';
  body: Statement[];
}

export interface TransitionStatement extends ASTNode {
  type: 'TransitionStatement';
  target: string;
}

export interface LogStatement extends ASTNode {
  type: 'LogStatement';
  message: string;
}

export interface SaysStatement extends ASTNode {
  type: 'SaysStatement';
  character: string;
  message: string;
}

export interface EndScene extends ASTNode { type: 'EndScene'; }
export interface EndStory extends ASTNode { type: 'EndStory'; }

// 3. Character & Security
export interface CharacterDeclaration extends ASTNode {
  type: 'CharacterDeclaration';
  name: string;
  fields: { name: string; type: string }[]; 
  perceivesBlocks: PerceivesBlock[];
}

export interface PerceivesBlock extends ASTNode {
  type: 'PerceivesBlock';
  target: string;  // Can be "TableName" or "db.TableName" or "CharacterType"
  policies: (MaskingPolicy | WherePolicy)[];
}

export interface MaskingPolicy extends ASTNode {
  type: 'MaskingPolicy';
  fields: string[];
}

export interface WherePolicy extends ASTNode {
  type: 'WherePolicy';
  condition: Expression;
}

export interface ThruStatement extends ASTNode {
  type: 'ThruStatement';
  character: string;
  body: Statement[];
}

// 4. Expressions
export type Expression = 
  | BinaryExpression 
  | UnaryExpression 
  | Literal 
  | Identifier 
  | MemberAccess   // Needed for "if traveler.gold > 0"
  | FunctionCall   // Needed for "input(...)"
  | MethodCall;    // Needed for "obj.method()"

export interface BinaryExpression extends ASTNode {
  type: 'BinaryExpression';
  left: Expression;
  operator: string;
  right: Expression;
}

export interface UnaryExpression extends ASTNode {
  type: 'UnaryExpression';
  operator: string;
  operand: Expression;
}

export interface Literal extends ASTNode {
  type: 'Literal';
  value: string | number | boolean;
}

export interface Identifier extends ASTNode {
  type: 'Identifier';
  name: string;
}

// THE GRAMMAR STRUCTURE FOR DOT NOTATION
export interface MemberAccess extends ASTNode {
  type: 'MemberAccess';
  object: string;   // "traveler" or "hero"
  property: string; // "name" or "health"
}

export interface FunctionCall extends ASTNode {
  type: 'FunctionCall';
  name: string;
  arguments: Expression[];
}

export interface MethodCall extends ASTNode {
  type: 'MethodCall';
  object: string;    // "database" or "player"
  method: string;    // "query" or "attack"
  arguments: Expression[];
}