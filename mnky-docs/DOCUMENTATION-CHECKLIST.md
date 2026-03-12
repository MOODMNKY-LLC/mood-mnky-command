# Documentation Checklist

Use this checklist when making changes to the MOOD MNKY codebase to ensure documentation is properly updated.

## Identifying Documentation Needs

- [ ] **Determine Documentation Impact**: Assess which documentation is affected by your changes
  - [ ] READMEs in affected directories
  - [ ] Technical documentation in `/docs`
  - [ ] API documentation
  - [ ] User guides
  - [ ] Architecture documentation
  - [ ] Examples and tutorials

- [ ] **Classify Change Type**:
  - [ ] New feature (requires new documentation)
  - [ ] Enhancement (requires updating existing documentation)
  - [ ] Bug fix (may require documentation clarification)
  - [ ] Refactoring (may require documentation updates if public APIs change)
  - [ ] Deprecation (requires documentation updates and warnings)
  - [ ] Removal (requires documentation updates to remove references)

## Documentation Updates

### README Files

- [ ] **Update Directory READMEs**:
  - [ ] Purpose and description accurate
  - [ ] Directory structure updated
  - [ ] Usage examples current
  - [ ] Configuration details correct
  - [ ] Changelog section updated

### Changelog Entries

- [ ] **Add to Relevant Changelogs**:
  - [ ] Root `CHANGELOG.md` (for significant changes)
  - [ ] Component-specific changelog section in README
  - [ ] Include date in format `[YYYY-MM-DD]`
  - [ ] Categorize as Added/Changed/Deprecated/Removed/Fixed

### Technical Documentation

- [ ] **Update `/docs` Directory**:
  - [ ] Modify existing documentation to reflect changes
  - [ ] Add new documentation pages for new features
  - [ ] Update code examples to match current implementation
  - [ ] Update screenshots or diagrams if UI/UX changed
  - [ ] Mark deprecated features appropriately

### API Documentation

- [ ] **Update API Documentation**:
  - [ ] Endpoint documentation current
  - [ ] Request/response examples updated
  - [ ] Parameter descriptions accurate
  - [ ] Error responses documented
  - [ ] Authentication requirements clear

### Examples and Tutorials

- [ ] **Update Examples**:
  - [ ] Example code works with current implementation
  - [ ] Tutorial steps are accurate
  - [ ] Screenshots are current

## Documentation Quality Checks

- [ ] **Technical Accuracy**:
  - [ ] Information correctly describes the implementation
  - [ ] Code examples are correct and tested
  - [ ] All commands and steps work as described

- [ ] **Completeness**:
  - [ ] All aspects of the change are documented
  - [ ] Edge cases and limitations are mentioned
  - [ ] Required dependencies and prerequisites are listed

- [ ] **Consistency**:
  - [ ] Terminology is consistent with the rest of the documentation
  - [ ] Formatting follows documentation standards
  - [ ] Style aligns with existing documentation

## Documentation Administration

- [ ] **Update Documentation Audit**:
  - [ ] Add new documentation files to `DOCUMENTATION-AUDIT.md`
  - [ ] Mark completed documentation with checkmarks ✅
  - [ ] Note documentation that still needs work

- [ ] **Verify Documentation Links**:
  - [ ] Internal links between documentation pages work
  - [ ] External links are valid
  - [ ] No broken references to removed content

## Pull Request Requirements

- [ ] **Include in PR Description**:
  - [ ] List all documentation files changed
  - [ ] Note documentation-only changes
  - [ ] Complete documentation section of PR template

## After Merge

- [ ] **Verify Published Documentation**:
  - [ ] Documentation renders correctly in documentation site
  - [ ] Links work in the published version
  - [ ] Formatting appears as expected

## Notes

- Documentation changes should be submitted in the same PR as code changes whenever possible
- For large documentation changes, consider creating a separate documentation-focused PR
- When in doubt, err on the side of more documentation rather than less
- Use the Documentation Team as a resource for review and guidance