function MetricBox(props) {
  const {
    label, value, unit, style, showChangeIndicator, loading,
  } = props;

  return (
    <div style={style} className={loading ? 'metric-box loading' : 'metric-box'}>
      {!loading && (
        <>
          <div className="metric-box-label">{label}</div>
          <div className="is-flex is-flex-row">
            {showChangeIndicator && value && value > 0 && <span className="metric-box-indicator">&#9650;</span>}
            {showChangeIndicator && value && value < 0 && <span className="metric-box-indicator">&#9660;</span>}
            <div className="metric-box-value">
              {value}
            </div>
            <div className="metric-box-unit">{unit}</div>
          </div>
        </>
      )}
    </div>
  );
}

export default MetricBox;
