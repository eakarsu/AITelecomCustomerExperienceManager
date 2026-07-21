module.exports={
  caseType:'approved_customer_experience_recovery',initialState:'experience_event_registered',
  states:['experience_event_registered','sources_correlated','constraints_evaluated','recovery_proposed','operator_review','dispatch_approved','execution_observed','execution_failed','offline_pending','reconciled','recovered','closed'],
  createRoles:['experience_analyst','operations_manager'],assessmentRoles:['experience_analyst','network_reviewer','customer_reviewer'],auditRoles:['operations_manager','safety_reviewer','auditor'],connectorRoles:['integration_operator','operations_manager'],
  evidenceKinds:['customer_signal_manifest','network_telemetry_manifest','asset_site_snapshot','correlation_report','constraint_report','historical_replay','optimization_report','operator_approval','dispatch_receipt','execution_feedback','offline_receipt','provider_failure','reconciliation_report','manual_fallback_record','outcome_report'],
  requiredSignals:['customerVersion','telemetryVersion','assetVersion','constraintVersion','modelVersion','policyVersion','safetyLimitsVerified','sourceFreshnessSeconds','forecastError','constraintViolations','p95LatencyMs','missedEventRate','outcomeScore','offlineStatus'],
  professionalBoundary:'Recommendations require network and customer-operations approval. Assessment cannot dispatch work, change service, contact customers, control devices, or certify safety.',
  connectors:[{name:'telemetry',purpose:'timestamped read-only network observations'},{name:'crm_billing',purpose:'minimal authoritative customer and case versions'},{name:'erp_wms_tms',purpose:'work and inventory status receipts'},{name:'scada_device',purpose:'read-only asset status; commands prohibited'},{name:'gis',purpose:'versioned asset and site geometry'},{name:'weather',purpose:'timestamped external condition receipts'},{name:'maintenance',purpose:'work-order ownership and feedback receipts'},{name:'notification',purpose:'approved delivery receipts'}],
  transitions:[
    {from:'experience_event_registered',action:'correlate_sources',to:'sources_correlated',roles:['experience_analyst','integration_operator'],requiresEvidence:true},
    {from:'sources_correlated',action:'evaluate_constraints',to:'constraints_evaluated',roles:['network_reviewer'],requiresEvidence:true,dualControl:true},
    {from:'constraints_evaluated',action:'record_recovery_proposal',to:'recovery_proposed',roles:['experience_analyst'],requiresEvidence:true},
    {from:'recovery_proposed',action:'submit_operator_review',to:'operator_review',roles:['network_reviewer','customer_reviewer'],requiresEvidence:true,dualControl:true},
    {from:'operator_review',action:'approve_dispatch_observation',to:'dispatch_approved',roles:['operations_manager','safety_reviewer'],requiresEvidence:true,dualControl:true},
    {from:'dispatch_approved',action:'record_execution_feedback',to:'execution_observed',roles:['integration_operator','operations_manager'],requiresEvidence:true},
    {from:'dispatch_approved',action:'record_execution_failure',to:'execution_failed',roles:['integration_operator','operations_manager'],requiresEvidence:true},
    {from:'dispatch_approved',action:'record_offline_pending',to:'offline_pending',roles:['integration_operator'],requiresEvidence:true},
    {from:'execution_failed',action:'record_reconciliation',to:'reconciled',roles:['network_reviewer','operations_manager'],requiresEvidence:true,dualControl:true},
    {from:'offline_pending',action:'record_reconciliation',to:'reconciled',roles:['integration_operator','operations_manager'],requiresEvidence:true},
    {from:'execution_observed',action:'record_recovery',to:'recovered',roles:['customer_reviewer','operations_manager'],requiresEvidence:true,dualControl:true},
    {from:'reconciled',action:'record_recovery',to:'recovered',roles:['customer_reviewer','operations_manager'],requiresEvidence:true,dualControl:true},
    {from:'recovered',action:'close_case',to:'closed',roles:['operations_manager','auditor'],requiresEvidence:true}
  ],
  acceptedFixture:{customerVersion:'c1',telemetryVersion:'t1',assetVersion:'a1',constraintVersion:'k1',modelVersion:'m1',policyVersion:'p1',safetyLimitsVerified:true,sourceFreshnessSeconds:20,forecastError:0.05,constraintViolations:0,p95LatencyMs:700,missedEventRate:0.01,outcomeScore:0.92,offlineStatus:'reconciled'},
  rejectedFixture:{customerVersion:'c1',telemetryVersion:'t1',assetVersion:'a1',constraintVersion:'k1',modelVersion:'m1',policyVersion:'p1',safetyLimitsVerified:true,sourceFreshnessSeconds:900,forecastError:0.05,constraintViolations:0,p95LatencyMs:700,missedEventRate:0.01,outcomeScore:0.92,offlineStatus:'reconciled'},
  readyDisposition:'operator_customer_recovery_review_required',holdDisposition:'stale_constraint_latency_or_outcome_hold',decisionField:'dispatchCommand',
  assess:x=>{const freshness=Number(x.sourceFreshnessSeconds),error=Number(x.forecastError),violations=Number(x.constraintViolations),latency=Number(x.p95LatencyMs),missed=Number(x.missedEventRate),outcome=Number(x.outcomeScore);const ready=x.safetyLimitsVerified===true&&freshness<=120&&error<=0.1&&violations===0&&latency<=1000&&missed<=0.02&&outcome>=0.85&&x.offlineStatus==='reconciled';return{disposition:ready?'operator_customer_recovery_review_required':'stale_constraint_latency_or_outcome_hold',dispatchCommand:null,customerContactCommand:null,metrics:{freshness,error,violations,latency,missed,outcome},versions:{customer:x.customerVersion,telemetry:x.telemetryVersion,asset:x.assetVersion,constraints:x.constraintVersion,model:x.modelVersion}};}
};
