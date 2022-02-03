function MetricBox(props) {
  const { label, value, unit } = props;

  return (
    <div className="metric-box">
      <div className="metric-box-label">{label}</div>
      <div className="is-flex is-flex-row">
        <div className="metric-box-value">{value}</div>
        <div className="metric-box-unit">{unit}</div>
      </div>
    </div>
  )
}

export default MetricBox;
