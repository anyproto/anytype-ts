// https://github.com/john-guerra/forceInABox#readme v1.0.0 Copyright 2021 undefined
(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('d3')) :
typeof define === 'function' && define.amd ? define(['d3'], factory) :
(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.forceInABox = factory(global.d3));
}(this, (function (d3) { 'use strict';

function _interopNamespace(e) {
if (e && e.__esModule) return e;
var n = Object.create(null);
if (e) {
Object.keys(e).forEach(function (k) {
if (k !== 'default') {
var d = Object.getOwnPropertyDescriptor(e, k);
Object.defineProperty(n, k, d.get ? d : {
enumerable: true,
get: function () {
return e[k];
}
});
}
});
}
n['default'] = e;
return Object.freeze(n);
}

var d3__namespace = /*#__PURE__*/_interopNamespace(d3);

function forceInABox() {
  // d3 style
  function constant(_) {
    return () => _;
  }

  function index(d) {
    return d.index;
  }

  let id = index,
    nodes = [],
    links = [], //needed for the force version
    tree,
    size = [100, 100],
    forceNodeSize = constant(1), // The expected node size used for computing the cluster node
    forceCharge = constant(-1),
    forceLinkDistance = constant(100),
    forceLinkStrength = constant(0.1),
    foci = {},
    // oldStart = force.start,
    linkStrengthIntraCluster = 0.1,
    linkStrengthInterCluster = 0.001,
    // oldGravity = force.gravity(),
    templateNodes = [],
    offset = [0, 0],
    templateForce,
    groupBy = function (d) {
      return d.cluster;
    },
    template = "treemap",
    enableGrouping = true,
    strength = 0.1;
  // showingTemplate = false;

  function force(alpha) {
    if (!enableGrouping) {
      return force;
    }
    if (template === "force") {
      //Do the tick of the template force and get the new focis
      templateForce.tick();
      getFocisFromTemplate();
    }

    for (let i = 0, n = nodes.length, node, k = alpha * strength; i < n; ++i) {
      node = nodes[i];
      node.vx += (foci[groupBy(node)].x - node.x) * k;
      node.vy += (foci[groupBy(node)].y - node.y) * k;
    }
  }

  function initialize() {
    if (!nodes) return;

    // let i,
    //     n = nodes.length,
    //     m = links.length,
    //     nodeById = map(nodes, id),
    //     link;

    if (template === "treemap") {
      initializeWithTreemap();
    } else {
      initializeWithForce();
    }
  }

  force.initialize = function (_) {
    nodes = _;
    initialize();
  };

  function getLinkKey(l) {
    let sourceID = groupBy(l.source),
      targetID = groupBy(l.target);

    return sourceID <= targetID
      ? sourceID + "~" + targetID
      : targetID + "~" + sourceID;
  }

  function computeClustersNodeCounts(nodes) {
    let clustersCounts = new Map(),
      tmpCount = {};

    nodes.forEach(function (d) {
      if (!clustersCounts.has(groupBy(d))) {
        clustersCounts.set(groupBy(d), { count: 0, sumforceNodeSize: 0 });
      }
    });

    nodes.forEach(function (d) {
      // if (!d.show) { return; }
      tmpCount = clustersCounts.get(groupBy(d));
      tmpCount.count = tmpCount.count + 1;
      tmpCount.sumforceNodeSize =
        tmpCount.sumforceNodeSize +
        Math.PI * (forceNodeSize(d) * forceNodeSize(d)) * 1.3;
      clustersCounts.set(groupBy(d), tmpCount);
    });

    return clustersCounts;
  }

  //Returns
  function computeClustersLinkCounts(links) {
    let dClusterLinks = new Map(),
      clusterLinks = [];

    links.forEach(function (l) {
      let key = getLinkKey(l),
        count;
      if (dClusterLinks.has(key)) {
        count = dClusterLinks.get(key);
      } else {
        count = 0;
      }
      count += 1;
      dClusterLinks.set(key, count);
    });

    dClusterLinks.forEach(function (value, key) {
      let source, target;
      source = key.split("~")[0];
      target = key.split("~")[1];
      if (source !== undefined && target !== undefined) {
        clusterLinks.push({
          source: source,
          target: target,
          count: value,
        });
      }
    });
    return clusterLinks;
  }

  //Returns the metagraph of the clusters
  function getGroupsGraph() {
    let gnodes = [],
      glinks = [],
      // edges = [],
      dNodes = new Map(),
      // totalSize = 0,
      c,
      i,
      cc,
      clustersCounts,
      clustersLinks;

    clustersCounts = computeClustersNodeCounts(nodes);
    clustersLinks = computeClustersLinkCounts(links);

    for (c of clustersCounts.keys()) {
      cc = clustersCounts.get(c);
      gnodes.push({
        id: c,
        size: cc.count,
        r: Math.sqrt(cc.sumforceNodeSize / Math.PI),
      }); // Uses approx meta-node size
      dNodes.set(c, i);
      // totalSize += size;
    }

    clustersLinks.forEach(function (l) {
      let source = dNodes.get(l.source),
        target = dNodes.get(l.target);
      if (source !== undefined && target !== undefined) {
        glinks.push({
          source: source,
          target: target,
          count: l.count,
        });
      }
    });

    return { nodes: gnodes, links: glinks };
  }

  function getGroupsTree() {
    let children = [],
      c,
      cc,
      clustersCounts;

    clustersCounts = computeClustersNodeCounts(force.nodes());

    for (c of clustersCounts.keys()) {
      cc = clustersCounts.get(c);
      children.push({ id: c, size: cc.count });
    }
    return { id: "clustersTree", children: children };
  }

  function getFocisFromTemplate() {
    //compute foci
    foci.none = { x: 0, y: 0 };
    templateNodes.forEach(function (d) {
      if (template === "treemap") {
        foci[d.data.id] = {
          x: d.x0 + (d.x1 - d.x0) / 2 - offset[0],
          y: d.y0 + (d.y1 - d.y0) / 2 - offset[1],
        };
      } else {
        foci[d.id] = {
          x: d.x - offset[0],
          y: d.y - offset[1],
        };
      }
    });
    return foci;
  }

  function initializeWithTreemap() {
    let treemap = d3__namespace.treemap().size(force.size());

    tree = d3__namespace
      .hierarchy(getGroupsTree())
      .sum(function (d) {
        return d.size;
      })
      .sort(function (a, b) {
        return b.height - a.height || b.value - a.value;
      });

    templateNodes = treemap(tree).leaves();
    getFocisFromTemplate();
  }

  function checkLinksAsObjects() {
    // Check if links come in the format of indexes instead of objects
    let linkCount = 0;
    if (nodes.length === 0) return;

    links.forEach(function (link) {
      let source, target;
      if (!nodes) return;
      source = link.source;
      target = link.target;
      if (typeof link.source !== "object") source = nodes[link.source];
      if (typeof link.target !== "object") target = nodes[link.target];
      if (source === undefined || target === undefined) {
        // console.error(link);
        throw Error(
          "Error setting links, couldnt find nodes for a link (see it on the console)"
        );
      }
      link.source = source;
      link.target = target;
      link.index = linkCount++;
    });
  }

  function initializeWithForce() {
    let net;

    if (!nodes || !nodes.length) {
      return;
    }

    if (nodes && nodes.length > 0) {
      if (groupBy(nodes[0]) === undefined) {
        throw Error(
          "Couldnt find the grouping attribute for the nodes. Make sure to set it up with forceInABox.groupBy('clusterAttr') before calling .links()"
        );
      }
    }

    checkLinksAsObjects();

    net = getGroupsGraph();
    templateForce = d3__namespace
      .forceSimulation(net.nodes)
      .force("x", d3__namespace.forceX(size[0] / 2).strength(0.1))
      .force("y", d3__namespace.forceY(size[1] / 2).strength(0.1))
      .force(
        "collide",
        d3__namespace
          .forceCollide(function (d) {
            return d.r;
          })
          .iterations(4)
      )
      .force("charge", d3__namespace.forceManyBody().strength(forceCharge))
      .force(
        "links",
        d3__namespace
          .forceLink(net.nodes.length ? net.links : [])
          .distance(forceLinkDistance)
          .strength(forceLinkStrength)
      );

    // console.log("Initialize with force ", templateForce.nodes().length, " ", templateForce.force("links").links().length);

    // let i = 0;
    // while (i++ < 500) templateForce.tick();

    templateNodes = templateForce.nodes();

    getFocisFromTemplate();
  }

  function drawTreemap(container) {
    // Delete the circle Template if it exists
    container.selectAll("circle.cell").remove();
    container.selectAll("line.cell").remove();
    container
      .selectAll("rect.cell")
      .data(templateNodes)
      .enter()
      .append("svg:rect")
      .attr("class", "cell")
      .attr("x", function (d) {
        return d.x0;
      })
      .attr("y", function (d) {
        return d.y0;
      })
      .attr("width", function (d) {
        return d.x1 - d.x0;
      })
      .attr("height", function (d) {
        return d.y1 - d.y0;
      });
  }

  function drawGraph(container) {
    // Delete the treemap if any
    container.selectAll("rect.cell").remove();
    let templateLinksSel = container
      .selectAll("line.cell")
      .data(templateForce.force("links").links());
    templateLinksSel
      .enter()
      .append("line")
      .attr("class", "cell")
      .merge(templateLinksSel)
      .attr("x2", function (d) {
        return d.source.x;
      })
      .attr("y2", function (d) {
        return d.source.y;
      })
      .attr("x1", function (d) {
        return d.target.x;
      })
      .attr("y1", function (d) {
        return d.target.y;
      })
      .style("stroke-width", "1px")
      .style("stroke-opacity", "0.5");

    let templateNodesSel = container
      .selectAll("circle.cell")
      .data(templateForce.nodes());
    templateNodesSel
      .enter()
      .append("svg:circle")
      .attr("class", "cell")
      .merge(templateNodesSel)
      .attr("cx", function (d) {
        return d.x;
      })
      .attr("cy", function (d) {
        return d.y;
      })
      .attr("r", function (d) {
        return d.r;
      });

    templateForce
      .on("tick", () => {
        // console.log("tick");
        drawGraph(container);
      })
      .restart();

    templateNodesSel.exit().remove();
    templateLinksSel.exit().remove();
  }

  force.drawTemplate = function (container) {
    // showingTemplate = true;
    if (template === "treemap") {
      drawTreemap(container);
    } else {
      drawGraph(container);
    }
    return force;
  };

  //Backwards compatibility
  force.drawTreemap = force.drawTemplate;

  force.deleteTemplate = function (container) {
    // showingTemplate = false;
    container.selectAll(".cell").remove();

    if (templateForce) {
      templateForce.on("tick", null).restart();
    }

    return force;
  };

  force.template = function (x) {
    if (!arguments.length) return template;
    template = x;
    initialize();
    return force;
  };

  force.groupBy = function (x) {
    if (!arguments.length) return groupBy;
    if (typeof x === "string") {
      groupBy = function (d) {
        return d[x];
      };
      return force;
    }
    groupBy = x;
    return force;
  };

  force.enableGrouping = function (x) {
    if (!arguments.length) return enableGrouping;
    enableGrouping = x;
    // update();
    return force;
  };

  force.strength = function (x) {
    if (!arguments.length) return strength;
    strength = x;
    return force;
  };

  force.getLinkStrength = function (e) {
    if (enableGrouping) {
      if (groupBy(e.source) === groupBy(e.target)) {
        if (typeof linkStrengthIntraCluster === "function") {
          return linkStrengthIntraCluster(e);
        } else {
          return linkStrengthIntraCluster;
        }
      } else {
        if (typeof linkStrengthInterCluster === "function") {
          return linkStrengthInterCluster(e);
        } else {
          return linkStrengthInterCluster;
        }
      }
    } else {
      // Not grouping return the intracluster
      if (typeof linkStrengthIntraCluster === "function") {
        return linkStrengthIntraCluster(e);
      } else {
        return linkStrengthIntraCluster;
      }
    }
  };

  force.id = function (_) {
    return arguments.length ? ((id = _), force) : id;
  };

  force.size = function (_) {
    return arguments.length ? ((size = _), force) : size;
  };

  force.linkStrengthInterCluster = function (_) {
    return arguments.length
      ? ((linkStrengthInterCluster = _), force)
      : linkStrengthInterCluster;
  };

  force.linkStrengthIntraCluster = function (_) {
    return arguments.length
      ? ((linkStrengthIntraCluster = _), force)
      : linkStrengthIntraCluster;
  };

  force.nodes = function (_) {
    return arguments.length ? ((nodes = _), force) : nodes;
  };

  force.links = function (_) {
    if (!arguments.length) return links;
    if (_ === null) links = [];
    else links = _;
    initialize();
    return force;
  };

  force.forceNodeSize = function (_) {
    return arguments.length
      ? ((forceNodeSize = typeof _ === "function" ? _ : constant(+_)),
        initialize(),
        force)
      : forceNodeSize;
  };

  // Legacy support
  force.nodeSize = force.forceNodeSize;

  force.forceCharge = function (_) {
    return arguments.length
      ? ((forceCharge = typeof _ === "function" ? _ : constant(+_)),
        initialize(),
        force)
      : forceCharge;
  };

  force.forceLinkDistance = function (_) {
    return arguments.length
      ? ((forceLinkDistance = typeof _ === "function" ? _ : constant(+_)),
        initialize(),
        force)
      : forceLinkDistance;
  };

  force.forceLinkStrength = function (_) {
    return arguments.length
      ? ((forceLinkStrength = typeof _ === "function" ? _ : constant(+_)),
        initialize(),
        force)
      : forceLinkStrength;
  };

  force.offset = function (_) {
    return arguments.length
      ? ((offset = typeof _ === "function" ? _ : constant(+_)), force)
      : offset;
  };

  force.getFocis = getFocisFromTemplate;

  return force;
}

// module.exports = forceInABox;

return forceInABox;

})));