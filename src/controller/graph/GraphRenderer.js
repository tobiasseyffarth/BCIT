// import cytoscape from "cytoscape";
import * as querygraph from './GraphQuery';
import * as creategraph from './GraphEditor';

/*
function renderGraph(g) {
  // creategraph.createGraphFromInfra(this.graph, infraclass.infra);
  let layout = g.layout({name: 'breadthfirst'}); //weitere Optionen unter http://js.cytoscape.org/#layouts
  g.layout({name: 'breadthfirst'}); //weitere Optionen unter http://js.cytoscape.org/#layouts
  layout.run();
  g.autolock(false); //elements can not be moved by the user

  g.reset();//Groesse anpassen

  g.resize();
  g.fit();// alle KNoten werden im Container angzeigt
}
*/

export function resizeGraph(graph) {
  graph.reset();// Groesse anpassen
  graph.fit();// alle KNoten werden im Container angzeigt
  graph.resize(); // Komplette Container nutzen
}

function removeIT(graph) {
  const nodes = graph.nodes();
  let removed;

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.data('nodetype') === 'infra') {
      const dir_pred = querygraph.getDirectPredecessor(node);
      const dir_suc = querygraph.getDirectSuccessor(node);
      if (dir_pred.length === 0 && node.data('nodestyle') !== 'changedElement') {
        node.remove();
        removed = true;
      } else if (node.data('nodestyle') === 'between' && dir_suc.length === 0){
        node.remove();
        removed = true;
      }
    }
  }

  if (removed) {
    removeIT(graph);
  }
}

export function clearGraph(graph) {
  creategraph.removeSingleNodes(graph);
  removeIT(graph);
}

export function removeActivity(graph) {
  const _nodes = graph.nodes();

  for (let i = 0; i < _nodes.length; i++) {
    const node = _nodes[i];
    const nodetype = node.data('nodetype');
    const nodestyle = node.data('nodestyle');

    if (nodetype === 'businessprocess' && nodestyle === 'between') {
      node.remove();
    }
  }
}

function drawCompliancePreds(node, compliance_preds) {
  const xNode = node.position('x');
  const yNode = node.position('y');

  for (let j = 0; j < compliance_preds.length; j++) {
    const compliance = compliance_preds[j];
    const xCompliance = xNode + (j + 1) * 100;
    const yCompliance = yNode;
    compliance.position({ x: xCompliance, y: yCompliance });
  }
}

function updateInfraCP(node) {
  const changed_node = node;

  changed_node.position({ x: 270, y: 150 });
  const x_changed = changed_node.position('x');
  const y_changed = changed_node.position('y');

  // consider compliance of changed_node
  if (changed_node.data('nodetype') !== 'complianceprocess') {
    const compliance_preds = querygraph.getPredecessors(changed_node, 'compliance');
    drawCompliancePreds(changed_node, compliance_preds);
  }

  if (changed_node.data('nodetype') === 'complianceprocess') {
    const dir_comp_sucs = querygraph.getDirectSuccessor(changed_node, 'compliance');

    for (let i = 0; i < dir_comp_sucs.length; i++) {
      const compliance = dir_comp_sucs[i];
      const x_compliance = x_changed + (i + 1) * 100;
      const y_compliance = y_changed;
      compliance.position({ x: x_compliance, y: y_compliance });

      const com_preds = querygraph.getPredecessors(compliance, 'compliance');
      drawCompliancePreds(compliance, com_preds);
    }
  }

  // consider infra_preds and its compliance requirements
  const preds = querygraph.getPredecessors(changed_node, '!compliance');

  for (let i = 0; i < preds.length; i++) {
    const node = preds[i];
    const x_node = x_changed;
    const y_node = y_changed + (i + 1) * 80;
    node.position({ x: x_node, y: y_node });

    const compliance_preds = querygraph.getPredecessors(node, 'compliance');

    drawCompliancePreds(node, compliance_preds);
  }

  // consider sucs
  const sucs = querygraph.getSuccessors(changed_node, '!compliance');

  for (let i = 0; i < sucs.length; i++) {
    const node = sucs[i];
    const x_node = x_changed;
    const y_node = y_changed - (i + 1) * 80;
    node.position({ x: x_node, y: y_node });

    if (node.data('nodetype') !== 'complianceprocess') {
      const compliance_preds = querygraph.getPredecessors(node, 'compliance');
      drawCompliancePreds(node, compliance_preds);
    }

    if (node.data('nodetype') === 'complianceprocess') {
      // consider compliance of compliance process
      const dir_comp_sucs = querygraph.getDirectSuccessor(node, 'compliance');
      let x_compliance;
      let y_compliance;

      for (let j = 0; j < dir_comp_sucs.length; j++) {
        const compliance = dir_comp_sucs[j];
        x_compliance = x_node + (j + 1) * 100;
        y_compliance = y_node;
        compliance.position({ x: x_compliance, y: y_compliance });

        const com_preds = querygraph.getPredecessors(compliance, 'compliance');
        drawCompliancePreds(compliance, com_preds);
      }
    }
  }
}

function updateBusinessProcess(node) {
  const changedNode = node;

  changedNode.position({ x: 270, y: 150 });
  const xChanged = changedNode.position('x');
  const yChanged = changedNode.position('y');

  const dirCompPreds = querygraph.getDirectPredecessor(changedNode, 'compliance');
  for (let i = 0; i < dirCompPreds.length; i++) {
    const compliance = dirCompPreds[i];

    const xCompliance = xChanged + (i + 1) * 100;
    const yCompliance = yChanged + (i + 1) * 100;
    compliance.position({ x: xCompliance, y: yCompliance });

    // draw compliance preds horizontal
    let compPreds = querygraph.getPredecessors(compliance, 'compliance');
    drawCompliancePreds(compliance, compPreds);


    // draw other preds vertical
    const preds = querygraph.getPredecessors(compliance, '!compliance');

    for (let j = 0; j < preds.length; j++) {
      const pred = preds[j];
      if (pred !== changedNode) { // avoid that predecessor is the changed element
        const xPred = xCompliance;
        const yPred = yCompliance - (j + 1) * 100;

        pred.position({ x: xPred, y: yPred });

        compPreds = querygraph.getPredecessors(pred, 'compliance');
        drawCompliancePreds(pred, compPreds);
      }
    }
  }

  // draw IT preds vertical
  const itPreds = querygraph.getPredecessors(changedNode, 'infra');
  for (let i = 0; i < itPreds.length; i++) {
    const infra = itPreds[i];

    const xInfra = xChanged;
    const yInfra = yChanged - (i + 1) * 100;
    infra.position({ x: xInfra, y: yInfra });
    // draw compliance preds horizontal
    const compPreds = querygraph.getPredecessors(infra, 'compliance');
    drawCompliancePreds(infra, compPreds);
  }
}

function updateCompliance(node) {
  console.log('update compliance');

  const changedNode = node;

  changedNode.position({ x: 270, y: 150 });
  const xChanged = changedNode.position('x');
  const yChanged = changedNode.position('y');

  // consider compliance preds
  const compliancePreds = querygraph.getPredecessors(changedNode, 'compliance');
  for (let i = 0; i < compliancePreds.length; i++) {
    const compliance = compliancePreds[i];
    const xCompliance = xChanged - (i + 1) * 100;
    const yCompliance = yChanged - (i + 1) * 100;
    compliance.position({ x: xCompliance, y: yCompliance });

    // draw other preds vertical
    const preds = querygraph.getPredecessors(compliance, '!compliance');

    for (let j = 0; j < preds.length; j++) {
      const pred = preds[j];
      if (pred !== changedNode) { // avoid that predecessor is the changed element
        const xPred = xCompliance;
        const yPred = yCompliance - (j + 1) * 100;

        pred.position({ x: xPred, y: yPred });

        const compPreds = querygraph.getPredecessors(pred, 'compliance');
        drawCompliancePreds(pred, compPreds);
      }
    }
  }

  // consider compliance sucs
  const complianceSucs = querygraph.getSuccessors(changedNode, 'compliance');
  for (let i = 0; i < complianceSucs.length; i++) {
    const compliance = complianceSucs[i];
    const xCompliance = xChanged + (i + 1) * 100;
    const yCompliance = yChanged + (i + 1) * 100;
    compliance.position({ x: xCompliance, y: yCompliance });

    // draw other preds vertical
    const preds = querygraph.getPredecessors(compliance, '!compliance');

    for (let j = 0; j < preds.length; j++) {
      const pred = preds[j];
      if (pred !== changedNode) { // avoid that predecessor is the changed element
        const xPred = xCompliance;
        const yPred = yCompliance - (j + 1) * 100;

        pred.position({ x: xPred, y: yPred });

        const compPreds = querygraph.getPredecessors(pred, 'compliance');
        drawCompliancePreds(pred, compPreds);
      }
    }
  }


  // consider preds != compliance
  const preds = querygraph.getPredecessors(changedNode, '!compliance');

  for (let j = 0; j < preds.length; j++) {
    const pred = preds[j];
    if (pred !== changedNode) { // avoid that predecessor is the changed element
      const xPred = xChanged;
      const yPred = yChanged - (j + 1) * 100;

      pred.position({ x: xPred, y: yPred });

      const compPreds = querygraph.getPredecessors(pred, 'compliance');
      drawCompliancePreds(pred, compPreds);
    }
  }
}

export function drawAnalyze(graph) {
  const changed_node = graph.nodes().filter('node[nodestyle = "changedElement"]')[0]; // only one change node possible
  const nodetype = changed_node.data('nodetype');

  if (nodetype === 'infra' || nodetype === 'complianceprocess') {
    updateInfraCP(changed_node);
  }

  if (nodetype === 'compliance') {
    console.log('update compliance');
    updateCompliance(changed_node);
  }

  if (nodetype === 'businessprocess') {
    console.log('update business process');
    updateBusinessProcess(changed_node);
  }
  clearGraph(graph);
}
