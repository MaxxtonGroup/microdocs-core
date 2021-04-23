import { ProjectTree } from "./project-tree.model";
import { ProjectNode } from "./project-node.model";
import { DependencyTypes } from '../';

describe( '#ProjectTree: ', () => {

  describe( '#addProject', () => {

    test( 'add new project', () => {
      const projectTree = new ProjectTree();
      const projectNode = new ProjectNode( 'test-project' );

      projectTree.addProject( projectNode );

      expect( projectTree.projects ).toEqual( [ projectNode ] );
    } );

    test( 'add existing project', () => {
      const projectTree = new ProjectTree();
      const projectNode1 = new ProjectNode( 'test-project' );
      const projectNode2 = new ProjectNode( 'test-project' );
      projectTree.projects.push( projectNode1 );

      projectTree.addProject( projectNode2 );

      expect( projectTree.projects ).toEqual( [ projectNode2 ] );
    } );

  } );

  describe( '#removeProject', () => {

    test( 'remove existing project', () => {
      const projectTree = new ProjectTree();
      const projectNode = new ProjectNode( 'test-project' );
      projectTree.projects.push( projectNode );

      projectTree.removeProject( projectNode );

      expect( [] ).toEqual( projectTree.projects );
    } );

    test( 'remove new project', () => {
      const projectTree = new ProjectTree();
      const projectNode = new ProjectNode( 'test-project' );

      projectTree.removeProject( projectNode );

      expect( projectTree.projects ).toEqual( [] );
    } );

    /**
     * Remove project from the root tree and remove dependencies to that project from all over the tree
     */
    test( 'remove project with reference', () => {
      const rawTree: any = {
        'test-project': {},
        'consume1-project': {
          'dependencies': {
            'test-project': {
              type: DependencyTypes.USES,
              item: {
                $ref: '#/test-project'
              }
            }
          }
        },
        'consume2-project': {
          'dependencies': {
            'test-project': {
              type: DependencyTypes.USES,
              item: {
                $ref: '#/test-project'
              }
            }
          }
        }
      };
      const projectTree = ProjectTree.link( rawTree );

      projectTree.removeProjectByName( 'test-project' );

      expect( projectTree.unlink() ).toEqual( {
        'consume1-project': {},
        'consume2-project': {}
      } );
    } );

    /**
     * Rearrange siblings from the removed node which are used else were
     */
    test( 'remove project and rearrange first siblings', () => {
      const rawTree: any = {
        'test-project': {
          version: '1.0.0',
          dependencies: {
            'test2-project': {
              type: DependencyTypes.USES,
              item: {
                version: '1.0.0',
                group: 'test-group2'
              }
            }
          }
        },
        'consume-project': {
          version: '1.0.0',
          dependencies: {
            'test3-project': {
              type: DependencyTypes.USES,
              item: {
                $ref: '#/test-project/dependencies/test2-project/item'
              }
            }
          }
        }
      };
      const projectTree = ProjectTree.link( rawTree );

      projectTree.removeProjectByName( 'test-project' );

      expect( projectTree.unlink() ).toEqual( {
        'consume-project': {
          version: '1.0.0',
          dependencies: {
            'test3-project': {
              type: DependencyTypes.USES,
              item: {
                version: '1.0.0',
                group: 'test-group2'
              }
            }
          }
        }
      } );
    } );

    /**
     * Rearrange siblings from the removed node which are used else were
     */
    test( 'remove project and rearrange nested siblings', () => {
      const rawTree: any = {
        'test-project': {
          version: '1.0.0',
          dependencies: {
            'test2-project': {
              type: DependencyTypes.USES,
              item: {
                group: 'test-group2',
                version: '1.0.0',
                dependencies: {
                  'test6-project': {
                    type: DependencyTypes.USES,
                    item: {
                      dependencies: {
                        'test3-project': {
                          type: DependencyTypes.USES,
                          item: {
                            $ref: '#/test-project/dependencies/test3-project/item'
                          }
                        }
                      },
                      group: 'test-group6',
                      version: '1.0.0'
                    }
                  },
                  'test4-project': {
                    type: DependencyTypes.USES,
                    item: {
                      version: '1.0.0',
                      group: 'test-group4',
                      dependencies: {
                        'test5-project': {
                          type: DependencyTypes.USES,
                          item: {
                            group: 'test-group5',
                            version: '1.0.0'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            'test3-project': {
              type: DependencyTypes.USES,
              item: {
                version: '1.0.0',
                group: 'test-group3'
              }
            }
          }
        },
        'consume-project': {
          version: '1.0.0',
          dependencies: {
            'consume2-project': {
              type: DependencyTypes.USES,
              item: {
                version: '1.0.0',
                dependencies: {
                  'consume3-project': {
                    item: {
                      version: '1.0.0',
                      dependencies: {
                        'test5-project': {
                          item: {
                            $ref: '#/test-project/dependencies/test2-project/item/dependencies/test4-project/item/dependencies/test5-project/item'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            'test6-project': {
              type: DependencyTypes.USES,
              item: {
                $ref: '#/test-project/dependencies/test2-project/item/dependencies/test6-project/item'
              }
            }
          }
        }
      };
      const projectTree = ProjectTree.link( rawTree );

      projectTree.removeProjectByName( 'test-project' );

      expect( projectTree.unlink() ).toEqual( {
        'consume-project': {
          version: '1.0.0',
          dependencies: {
            'consume2-project': {
              type: DependencyTypes.USES,
              item: {
                version: '1.0.0',
                dependencies: {
                  'consume3-project': {
                    item: {
                      version: '1.0.0',
                      dependencies: {
                        'test5-project': {
                          item: {
                            version: '1.0.0',
                            group: 'test-group5'
                          }
                        }
                      }
                    }
                  }
                }
              }
            },
            'test6-project': {
              type: DependencyTypes.USES,
              item: {
                version: '1.0.0',
                group: 'test-group6',
                dependencies: {
                  'test3-project': {
                    type: DependencyTypes.USES,
                    item: {
                      version: '1.0.0',
                      group: 'test-group3'
                    }
                  }
                }
              }
            }
          }
        }
      } );
    } );
  } );
} );
