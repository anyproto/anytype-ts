import React, { Component } from "react";

interface DotIndicatorProps {
  activeIndex: number;
  count: number;
}

class DotIndicator extends Component<DotIndicatorProps> {
  render() {
    const { activeIndex, count } = this.props;
    const dots = [];

    for (let i = 0; i < count; i++) {
      dots.push(
        <span
          key={i}
          className={`dot${i === activeIndex ? " active" : ""}`}
        ></span>
      );
    }

    return <div className="dotIndicator">{dots}</div>;
  }
}

export default DotIndicator;
