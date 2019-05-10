// contains functions to check whether alternatives can be executed

import * as GraphQuery from './../graph/GraphQuery';

/*

W(Task_A): bis Task_A --> W:Weak Unitl
Task_A -> X(Task_B): Task_B direkt nach Task_A --> X: next

G(Task_A -> F(Task_B)): Task_B kommt irgendwann nach Task_A --> F: eventually

*/

function getTaskId(ltlString){
  const start = ltlString.indexOf('W(') + 1;
  let result = new String();

  for (let i = start; ltlString.length; i++){
    const char = ltlString.charAt(i);

    if (char !==')'){
      result = result + char;
    } else {
      break;
    }
  }
  return result;
}

function isTaskBefore(taskId, sucId){

}

function isTaskAfter(taskId, predId){

}

function isTaskBetween(startTaskId, endTaskId){

}

export function isExecutable(cpNode, reqNode, resultGraph){
  const rule = reqNode.data('rule');
  const ce = GraphQuery.getPropsValue(cpNode.data('props'), 'controlledEntity');
  const taskId = getTaskId(rule);

  return isTaskBefore(ce, taskId);


  // check wheather the requirements to execute are obsolete in the result graph

}
